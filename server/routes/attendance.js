import express from 'express';
import db from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// TEACHER ATTENDANCE ENDPOINTS

// POST /api/attendance/teacher/check-in - Check in for teacher
router.post('/teacher/check-in', verifyToken, (req, res) => {
  try {
    const { location } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existing = db.prepare(`
      SELECT id FROM teacher_attendance
      WHERE user_id = ? AND date = ?
    `).get(req.user.id, today);

    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const checkInTime = new Date().toISOString();
    const hour = new Date().getHours();
    const status = hour > 9 ? 'late' : 'present';

    const result = db.prepare(`
      INSERT INTO teacher_attendance (user_id, date, check_in, status, location)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, today, checkInTime, status, location || 'School Campus');

    const record = db.prepare(`
      SELECT ta.*, u.name
      FROM teacher_attendance ta
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE ta.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(record);
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Failed to check in' });
  }
});

// PUT /api/attendance/teacher/check-out - Check out for teacher
router.put('/teacher/check-out', verifyToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const record = db.prepare(`
      SELECT id FROM teacher_attendance
      WHERE user_id = ? AND date = ?
    `).get(req.user.id, today);

    if (!record) {
      return res.status(404).json({ error: 'No check-in found for today' });
    }

    const checkOutTime = new Date().toISOString();

    db.prepare(`
      UPDATE teacher_attendance
      SET check_out = ?
      WHERE id = ?
    `).run(checkOutTime, record.id);

    const updatedRecord = db.prepare(`
      SELECT ta.*, u.name
      FROM teacher_attendance ta
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE ta.id = ?
    `).get(record.id);

    return res.json(updatedRecord);
  } catch (error) {
    console.error('Check-out error:', error);
    return res.status(500).json({ error: 'Failed to check out' });
  }
});

// GET /api/attendance/teacher - Get teacher attendance by date range
router.get('/teacher', verifyToken, (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;

    let query = `
      SELECT ta.*, u.name
      FROM teacher_attendance ta
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      query += ' AND ta.user_id = ?';
      params.push(user_id);
    } else if (req.user.role === 'teacher') {
      query += ' AND ta.user_id = ?';
      params.push(req.user.id);
    }

    if (start_date) {
      query += ' AND ta.date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND ta.date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY ta.date DESC';

    const attendance = db.prepare(query).all(...params);
    return res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ error: 'Failed to get attendance' });
  }
});

// STUDENT ATTENDANCE ENDPOINTS

// POST /api/attendance/student - Mark student attendance (array)
router.post('/student', verifyToken, (req, res) => {
  try {
    const { class_id, date, attendance_data } = req.body;

    if (!class_id || !date || !Array.isArray(attendance_data)) {
      return res.status(400).json({ error: 'class_id, date, and attendance_data array are required' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO student_attendance (student_id, class_id, date, status, marked_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const results = [];
    const errors = [];

    attendance_data.forEach(({ student_id, status }) => {
      try {
        // Check if already marked
        const existing = db.prepare(`
          SELECT id FROM student_attendance
          WHERE student_id = ? AND date = ?
        `).get(student_id, date);

        if (existing) {
          // Update existing
          db.prepare(`
            UPDATE student_attendance
            SET status = ?, marked_by = ?
            WHERE student_id = ? AND date = ?
          `).run(status, req.user.id, student_id, date);
        } else {
          // Insert new
          insertStmt.run(student_id, class_id, date, status, req.user.id);
        }
        results.push({ student_id, status: 'success' });
      } catch (err) {
        errors.push({ student_id, error: err.message });
      }
    });

    return res.json({ success: results, errors });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// GET /api/attendance/student - Get student attendance
router.get('/student', verifyToken, (req, res) => {
  try {
    const { class_id, date, student_id } = req.query;

    let query = `
      SELECT sa.*, s.name as student_name, c.name as class_name, u.name as marked_by_name
      FROM student_attendance sa
      LEFT JOIN students s ON sa.student_id = s.id
      LEFT JOIN student_classes c ON sa.class_id = c.id
      LEFT JOIN users u ON sa.marked_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      query += ' AND sa.class_id = ?';
      params.push(class_id);
    }
    if (date) {
      query += ' AND sa.date = ?';
      params.push(date);
    }
    if (student_id) {
      query += ' AND sa.student_id = ?';
      params.push(student_id);
    }

    query += ' ORDER BY sa.date DESC, s.name ASC';

    const attendance = db.prepare(query).all(...params);
    return res.json(attendance);
  } catch (error) {
    console.error('Get student attendance error:', error);
    return res.status(500).json({ error: 'Failed to get attendance' });
  }
});

export default router;
