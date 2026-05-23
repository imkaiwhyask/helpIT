const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const db = getDb();
  const users = db.prepare(
    'SELECT id,name,email,role,department,phone,is_active,created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
});

router.post('/', (req, res) => {
  const { name, email, password, role = 'technician', department = '', phone = '' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name,email,password_hash,role,department,phone) VALUES (?,?,?,?,?,?)'
  ).run(name, email, hash, role, department, phone);

  const user = db.prepare('SELECT id,name,email,role,department,phone,is_active,created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, role, department, phone, is_active, password } = req.body;

  if (email && email !== user.email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, user.id);
    if (existing) return res.status(409).json({ error: 'Email already in use' });
  }

  let passwordHash = user.password_hash;
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    passwordHash = bcrypt.hashSync(password, 10);
  }

  db.prepare(
    'UPDATE users SET name=?,email=?,password_hash=?,role=?,department=?,phone=?,is_active=? WHERE id=?'
  ).run(
    name ?? user.name, email ?? user.email, passwordHash, role ?? user.role,
    department ?? user.department, phone ?? user.phone,
    is_active !== undefined ? (is_active ? 1 : 0) : user.is_active, user.id
  );

  const updated = db.prepare('SELECT id,name,email,role,department,phone,is_active,created_at FROM users WHERE id=?').get(user.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Unassign open tickets before deleting
  db.prepare("UPDATE tickets SET assigned_to = NULL WHERE assigned_to = ? AND status NOT IN ('resolved','closed')").run(user.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

  res.json({ message: 'User deleted' });
});

module.exports = router;
