const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function audit(action, actor, details) {
  console.info(JSON.stringify({ audit: action, actor, ts: new Date(), ...details }));
}

const ADMIN_USER_SELECT = {
  id: true, name: true, email: true, username: true, role: true,
  department: true, phone: true, is_active: true, must_change_password: true, created_at: true,
};

const TECH_USER_SELECT = {
  id: true, name: true, email: true, username: true, role: true, department: true,
};

// All authenticated users can list users (needed for ticket assignment dropdowns)
// Users get minimal fields, technicians get department+email, admins get full profile
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
    if (req.user.role === 'technician') {
      const users = await prisma.user.findMany({
        select: TECH_USER_SELECT,
        orderBy: { name: 'asc' },
      });
      return res.json(users);
    }
    const users = await prisma.user.findMany({
      select: ADMIN_USER_SELECT,
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

    const { name, email, username, password, role = 'technician', department = '', phone = '' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
    if (username && !/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return res.status(400).json({ error: 'Username must be 3–32 characters (letters, numbers, _ . -)' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (password.length > 128) return res.status(400).json({ error: 'Password too long' });
    if (!['admin', 'technician', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return res.status(409).json({ error: 'Email already in use' });
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) return res.status(409).json({ error: 'Username already in use' });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, username: username || null, password_hash: hash, role, department, phone },
      select: ADMIN_USER_SELECT,
    });
    audit('USER_CREATE', req.user.id, { targetId: user.id, email: user.email, role: user.role });
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

    const { name, email, username, role, department, phone, is_active, password } = req.body;

    if (role && !['admin', 'technician', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: user.id } } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }

    if (username !== undefined && username !== null && username !== user.username) {
      if (username && !/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return res.status(400).json({ error: 'Username must be 3–32 characters (letters, numbers, _ . -)' });
      if (username) {
        const existing = await prisma.user.findFirst({ where: { username, NOT: { id: user.id } } });
        if (existing) return res.status(409).json({ error: 'Username already in use' });
      }
    }

    let password_hash = user.password_hash;
    if (password) {
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      if (password.length > 128) return res.status(400).json({ error: 'Password too long' });
      password_hash = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name:        name        ?? user.name,
        email:       email       ?? user.email,
        username:    username !== undefined ? (username || null) : user.username,
        password_hash,
        role:        role        ?? user.role,
        department:  department  ?? user.department,
        phone:       phone       ?? user.phone,
        is_active:   is_active !== undefined ? Boolean(is_active) : user.is_active,
        ...(password ? { must_change_password: true } : {}),
      },
      select: ADMIN_USER_SELECT,
    });

    const changes = {};
    if (role && role !== user.role) changes.roleChange = { from: user.role, to: role };
    if (is_active !== undefined && Boolean(is_active) !== user.is_active) changes.activeChange = { from: user.is_active, to: Boolean(is_active) };
    if (Object.keys(changes).length) audit('USER_UPDATE', req.user.id, { targetId: user.id, ...changes });

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

    audit('USER_DELETE', req.user.id, { targetId: user.id, email: user.email, role: user.role });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
