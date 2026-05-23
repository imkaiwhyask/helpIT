const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  department: true, phone: true, is_active: true, created_at: true,
};

// All authenticated users can list users (needed for ticket assignment dropdowns)
// Regular users receive minimal fields only — no PII
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'user') {
      const users = await prisma.user.findMany({
        where: { role: { in: ['technician', 'admin'] }, is_active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return res.json(users);
    }
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { created_at: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin only — create user
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { name, email, password, role = 'technician', department = '', phone = '' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!['admin', 'technician', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password_hash: hash, role, department, phone },
      select: USER_SELECT,
    });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin only — update user
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, role, department, phone, is_active, password } = req.body;

    if (role && !['admin', 'technician', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: user.id } } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }

    let password_hash = user.password_hash;
    if (password) {
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      password_hash = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name:        name        ?? user.name,
        email:       email       ?? user.email,
        password_hash,
        role:        role        ?? user.role,
        department:  department  ?? user.department,
        phone:       phone       ?? user.phone,
        is_active:   is_active !== undefined ? Boolean(is_active) : user.is_active,
      },
      select: USER_SELECT,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin only — delete user
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { assigned_to: user.id, status: { notIn: ['resolved', 'closed'] } },
        data: { assigned_to: null },
      }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
