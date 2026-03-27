import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/teachers - Get all teachers
router.get('/', verifyToken, (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT id, name, email, subject, phone, classes, responsibilities, created_at
      FROM users
      WHERE role = 'teacher'
      ORDER BY name ASC
    `).all();

    return res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    return res.status(500).json({ error: 'Failed to get teachers' });
  }
});

// GET /api/teachers/:id - Get teacher by ID
router.get('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const teacher = db.prepare(`
      SELECT id, name, email, subject, phone, classes, responsibilities, created_at
      FROM users
      WHERE id = ? AND role = 'teacher'
    `).get(id);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    return res.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    return res.status(500).json({ error: 'Failed to get teacher' });
  }
});

// PUT /api/teachers/:id - Update teacher profile
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { subject, phone, classes, responsibilities } = req.body;

    // Verify user is updating their own profile or is admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const teacher = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(id, 'teacher');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const updates = [];
    const values = [];

    if (subject !== undefined) {
      updates.push('subject = ?');
      values.push(subject);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (classes !== undefined) {
      updates.push('classes = ?');
      values.push(classes);
    }
    if (responsibilities !== undefined) {
      updates.push('responsibilities = ?');
      values.push(responsibilities);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedTeacher = db.prepare(`
      SELECT id, name, email, subject, phone, classes, responsibilities, created_at
      FROM users
      WHERE id = ?
    `).get(id);

    return res.json(updatedTeacher);
  } catch (error) {
    console.error('Update teacher error:', error);
    return res.status(500).json({ error: 'Failed to update teacher' });
  }
});

export default router;
