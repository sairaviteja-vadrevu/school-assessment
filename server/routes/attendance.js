import express from 'express';
import { query } from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// TEACHER ATTENDANCE ENDPOINTS

// POST /api/attendance/teacher/check-in - Check in for teacher
router.post('/teacher/check-in', verifyToken, async (req, res) => {
  try {
    const { location } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existingResult = await query(`
      SELECT id FROM teacher_attendance
      WHERE user_id = $1 AND date = $2
    `, [req.user.id, today]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const checkInTime = new Date().toISOString();
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    // Late if check-in after 7:45 AM
    const status = (hour > 7 || (hour === 7 && minute > 45)) ? 'late' : 'present';

    const insertResult = await query(`
      INSERT INTO teacher_attendance (user_id, date, check_in, status, location)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [req.user.id, today, checkInTime, status, location || 'School Campus']);

    const recordResult = await query(`
      SELECT ta.check_in as "checkedInAt", ta.check_out as "checkedOutAt", ta.status, u.name
      FROM teacher_attendance ta
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE ta.id = $1
    `, [insertResult.rows[0].id]);

    return res.status(201).json(recordResult.rows[0]);
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Failed to check in' });
  }
});

// PUT /api/attendance/teacher/check-out - Check out for teacher
router.put('/teacher/check-out', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const recordResult = await query(`
      SELECT id FROM teacher_attendance
      WHERE user_id = $1 AND date = $2
    `, [req.user.id, today]);

    if (recordResult.rows.length === 0) {
      return res.status(404).json({ error: 'No check-in found for today' });
    }

    const recordId = recordResult.rows[0].id;
    const checkOutTime = new Date().toISOString();

    await query(`
      UPDATE teacher_attendance
      SET check_out = $1
      WHERE id = $2
    `, [checkOutTime, recordId]);

    const updatedResult = await query(`
      SELECT ta.check_in as "checkedInAt", ta.check_out as "checkedOutAt", ta.status, u.name
      FROM teacher_attendance ta
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE ta.id = $1
    `, [recordId]);

    return res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Check-out error:', error);
    return res.status(500).json({ error: 'Failed to check out' });
  }
});

// GET /api/attendance/teacher/today - Get today's status for logged-in teacher
router.get('/teacher/today', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(`
      SELECT check_in as "checkedInAt", check_out as "checkedOutAt", status
      FROM teacher_attendance
      WHERE user_id = $1 AND date = $2
    `, [req.user.id, today]);

    return res.json(result.rows[0] || { checkedInAt: null, checkedOutAt: null, status: null });
  } catch (error) {
    console.error('Get today attendance error:', error);
    return res.status(500).json({ error: 'Failed to get today attendance' });
  }
});

// GET /api/attendance/teacher/monthly - Get monthly stats for logged-in teacher
router.get('/teacher/monthly', verifyToken, async (req, res) => {
  try {
    // Use same date format as check-in (ISO date string) for consistency
    const todayStr = new Date().toISOString().split('T')[0];
    const year = parseInt(todayStr.substring(0, 4));
    const month = todayStr.substring(5, 7);
    const monthIndex = parseInt(month) - 1;
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    const result = await query(`
      SELECT date, status, check_in
      FROM teacher_attendance
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date ASC
    `, [req.user.id, startDate, endDate]);

    const records = result.rows;
    const presentDays = records.filter((r) => r.status === 'present').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;
    const lateDays = records.filter((r) => r.status === 'late').length;
    const onTimeDays = presentDays;

    // Build calendar
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const calendar = [];

    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      calendar.push({ date: '', status: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
      const record = records.find((r) => r.date === dateStr);
      calendar.push({ date: d, status: record?.status || null });
    }

    return res.json({ presentDays, absentDays, lateDays, onTimeDays, calendar });
  } catch (error) {
    console.error('Get monthly attendance error:', error);
    return res.status(500).json({ error: 'Failed to get monthly attendance' });
  }
});

// GET /api/attendance/teachers - Admin view: all teachers' attendance for a date
router.get('/teachers', verifyToken, adminOnly, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await query(`
      SELECT u.id, u.name, u.subject as department,
        ta.status, ta.check_in as "checkInTime", ta.check_out as "checkOutTime"
      FROM users u
      LEFT JOIN teacher_attendance ta ON ta.user_id = u.id AND ta.date = $1
      WHERE u.role = 'teacher'
      ORDER BY u.name ASC
    `, [targetDate]);

    const teachers = result.rows.map((t) => ({
      ...t,
      status: t.status || 'absent',
    }));

    return res.json(teachers);
  } catch (error) {
    console.error('Get teachers attendance error:', error);
    return res.status(500).json({ error: 'Failed to get teachers attendance' });
  }
});

// GET /api/attendance/teacher - Get teacher attendance by date range
router.get('/teacher', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;

    let sql = `
      SELECT ta.*, u.name
      FROM teacher_attendance ta
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (user_id) {
      sql += ` AND ta.user_id = $${paramCount++}`;
      params.push(user_id);
    } else if (req.user.role === 'teacher') {
      sql += ` AND ta.user_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (start_date) {
      sql += ` AND ta.date >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      sql += ` AND ta.date <= $${paramCount++}`;
      params.push(end_date);
    }

    sql += ' ORDER BY ta.date DESC';

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ error: 'Failed to get attendance' });
  }
});

// STUDENT ATTENDANCE ENDPOINTS

// GET /api/attendance/students/history - Attendance history for a class
router.get('/students/history', verifyToken, async (req, res) => {
  try {
    const { classId, date } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'classId is required' });
    }

    const result = await query(`
      SELECT
        sa.date,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as "presentCount",
        SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as "absentCount",
        SUM(CASE WHEN sa.status = 'late' THEN 1 ELSE 0 END) as "lateCount"
      FROM student_attendance sa
      WHERE sa.class_id = $1
      GROUP BY sa.date
      ORDER BY sa.date DESC
      LIMIT 30
    `, [classId]);

    return res.json(result.rows);
  } catch (error) {
    console.error('Get attendance history error:', error);
    return res.status(500).json({ error: 'Failed to get attendance history' });
  }
});

// POST /api/attendance/submit - Submit student attendance (frontend-friendly)
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { classId, date, attendance } = req.body;

    if (!classId || !date || !Array.isArray(attendance)) {
      return res.status(400).json({ error: 'classId, date, and attendance array are required' });
    }

    const results = [];
    const errors = [];

    for (const { studentId, status } of attendance) {
      try {
        const existingResult = await query(`
          SELECT id FROM student_attendance WHERE student_id = $1 AND date = $2
        `, [studentId, date]);

        if (existingResult.rows.length > 0) {
          await query(`
            UPDATE student_attendance SET status = $1, marked_by = $2 WHERE student_id = $3 AND date = $4
          `, [status, req.user.id, studentId, date]);
        } else {
          await query(`
            INSERT INTO student_attendance (student_id, class_id, date, status, marked_by)
            VALUES ($1, $2, $3, $4, $5)
          `, [studentId, classId, date, status, req.user.id]);
        }
        results.push({ studentId, status: 'success' });
      } catch (err) {
        errors.push({ studentId, error: err.message });
      }
    }

    return res.json({ success: results, errors });
  } catch (error) {
    console.error('Submit attendance error:', error);
    return res.status(500).json({ error: 'Failed to submit attendance' });
  }
});

// POST /api/attendance/student - Mark student attendance (array)
router.post('/student', verifyToken, async (req, res) => {
  try {
    const { class_id, date, attendance_data } = req.body;

    if (!class_id || !date || !Array.isArray(attendance_data)) {
      return res.status(400).json({ error: 'class_id, date, and attendance_data array are required' });
    }

    const results = [];
    const errors = [];

    for (const { student_id, status } of attendance_data) {
      try {
        // Check if already marked
        const existingResult = await query(`
          SELECT id FROM student_attendance
          WHERE student_id = $1 AND date = $2
        `, [student_id, date]);

        if (existingResult.rows.length > 0) {
          // Update existing
          await query(`
            UPDATE student_attendance
            SET status = $1, marked_by = $2
            WHERE student_id = $3 AND date = $4
          `, [status, req.user.id, student_id, date]);
        } else {
          // Insert new
          await query(`
            INSERT INTO student_attendance (student_id, class_id, date, status, marked_by)
            VALUES ($1, $2, $3, $4, $5)
          `, [student_id, class_id, date, status, req.user.id]);
        }
        results.push({ student_id, status: 'success' });
      } catch (err) {
        errors.push({ student_id, error: err.message });
      }
    }

    return res.json({ success: results, errors });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// GET /api/attendance/student - Get student attendance
router.get('/student', verifyToken, async (req, res) => {
  try {
    const { class_id, date, student_id } = req.query;

    let sql = `
      SELECT sa.*, s.name as student_name, c.name as class_name, u.name as marked_by_name
      FROM student_attendance sa
      LEFT JOIN students s ON sa.student_id = s.id
      LEFT JOIN student_classes c ON sa.class_id = c.id
      LEFT JOIN users u ON sa.marked_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (class_id) {
      sql += ` AND sa.class_id = $${paramCount++}`;
      params.push(class_id);
    }
    if (date) {
      sql += ` AND sa.date = $${paramCount++}`;
      params.push(date);
    }
    if (student_id) {
      sql += ` AND sa.student_id = $${paramCount++}`;
      params.push(student_id);
    }

    sql += ' ORDER BY sa.date DESC, s.name ASC';

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get student attendance error:', error);
    return res.status(500).json({ error: 'Failed to get attendance' });
  }
});

export default router;
