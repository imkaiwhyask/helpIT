const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { prisma } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// Generated once at startup — prevents timing-based user enumeration
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 12);

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES   = 30;

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,         // HTTPS only in production
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  department: true, phone: true, is_active: true, created_at: true,
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findFirst({ where: { email, is_active: true } });

    // Account lockout check
    if (user?.locked_until && user.locked_until > new Date()) {
      return res.status(429).json({ error: 'Account temporarily locked. Try again later.' });
    }

    const hash = user ? user.password_hash : DUMMY_HASH;
    const valid = await bcrypt.compare(password, hash);

    if (!user || !valid) {
      // Increment failed attempt counter; lock after MAX_FAILED_LOGINS
      if (user) {
        const count = user.failed_login_count + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failed_login_count: count,
            locked_until: count >= MAX_FAILED_LOGINS
              ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
              : null,
          },
        });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Successful login — reset lockout state
    await prisma.user.update({
      where: { id: user.id },
      data: { failed_login_count: 0, locked_until: null },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    const { password_hash, failed_login_count, locked_until, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: USER_SELECT,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
