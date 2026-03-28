import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /api/teachers - Create a new teacher (admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, email, subject, phone, classes } = req.body;

    if (!name || !email || !subject) {
      return res.status(400).json({ error: 'Name, email, and subject are required' });
    }

    const existingResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const defaultPassword = bcrypt.hashSync('teacher123', 10);

    const insertResult = await query(
      'INSERT INTO users (name, email, password, role, subject, phone, classes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email, defaultPassword, 'teacher', subject, phone || null, classes || null]
    );

    const teacher = insertResult.rows[0];
    const { password, ...teacherWithoutPassword } = teacher;

    return res.status(201).json(teacherWithoutPassword);
  } catch (error) {
    console.error('Create teacher error:', error);
    return res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// GET /api/teachers - Get all teachers
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, email, subject, phone, classes, responsibilities, created_at
      FROM users
      WHERE role = 'teacher'
      ORDER BY name ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('Get teachers error:', error);
    return res.status(500).json({ error: 'Failed to get teachers' });
  }
});

// GET /api/teachers/:id - Get teacher by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT id, name, email, subject, phone, classes, responsibilities, created_at
      FROM users
      WHERE id = $1 AND role = 'teacher'
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get teacher error:', error);
    return res.status(500).json({ error: 'Failed to get teacher' });
  }
});

// PUT /api/teachers/:id - Update teacher profile
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, phone, classes, responsibilities } = req.body;

    // Verify user is updating their own profile or is admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const teacherResult = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [id, 'teacher']);

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex++}`);
      values.push(subject);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (classes !== undefined) {
      updates.push(`classes = $${paramIndex++}`);
      values.push(classes);
    }
    if (responsibilities !== undefined) {
      updates.push(`responsibilities = $${paramIndex++}`);
      values.push(responsibilities);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const updatedResult = await query(`
      SELECT id, name, email, subject, phone, classes, responsibilities, created_at
      FROM users
      WHERE id = $1
    `, [id]);

    return res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Update teacher error:', error);
    return res.status(500).json({ error: 'Failed to update teacher' });
  }
});

export default router;
