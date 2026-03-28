import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { verifyToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, subject: user.subject, phone: user.phone, classes: user.classes, responsibilities: user.responsibilities },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role, subject, phone, classes, responsibilities FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

router.post('/register', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create accounts' });

    const { name, email, password, role, subject, phone, classes, responsibilities } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Name, email, password, and role are required' });
    if (!['admin', 'teacher'].includes(role)) return res.status(400).json({ error: 'Role must be admin or teacher' });

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, role, subject, phone, classes, responsibilities) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [name, email, hashedPassword, role, subject || null, phone || null, classes || null, responsibilities || null]
    );

    return res.status(201).json({ id: result.rows[0].id, name, email, role, subject, phone, classes, responsibilities });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

export default router;
