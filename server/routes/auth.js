import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { getDatabase } from '../db.js';
import { verifyToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token with 24h expiry
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subject: user.subject,
        phone: user.phone,
        classes: user.classes,
        responsibilities: user.responsibilities
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, subject, phone, classes, responsibilities FROM users WHERE id = ?')
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/auth/register — Admin-only: create a new account
router.post('/register', verifyToken, (req, res) => {
  try {
    // Only admins can create accounts
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create accounts' });
    }

    const { name, email, password, role, subject, phone, classes, responsibilities } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or teacher' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(
      'INSERT INTO users (name, email, password, role, subject, phone, classes, responsibilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, email, hashedPassword, role, subject || null, phone || null, classes || null, responsibilities || null);

    return res.status(201).json({
      id: result.lastInsertRowid,
      name,
      email,
      role,
      subject,
      phone,
      classes,
      responsibilities,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

export default router;
