import express from 'express';
import db from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/dashboard - Admin dashboard stats
router.get('/dashboard', verifyToken, adminOnly, (req, res) => {
  try {
    // Task completion rates
    const taskStats = db.prepare(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate
      FROM tasks
    `).get();

    // Attendance summaries
    const teacherAttendanceToday = db.prepare(`
      SELECT
        COUNT(*) as total_teachers,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
      FROM teacher_attendance
      WHERE date = DATE('now')
    `).get();

    const studentAttendanceToday = db.prepare(`
      SELECT
        COUNT(*) as total_students,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
      FROM student_attendance
      WHERE date = DATE('now')
    `).get();

    // Student academic concerns (low grades)
    const academicConcerns = db.prepare(`
      SELECT
        s.id,
        s.name,
        c.name as class_name,
        COUNT(DISTINCT a.id) as assessments_taken,
        ROUND(AVG(a.marks / a.total_marks * 100), 2) as average_percentage,
        GROUP_CONCAT(DISTINCT a.grade) as grades
      FROM students s
      LEFT JOIN assessments a ON s.id = a.student_id
      LEFT JOIN student_classes c ON s.class_id = c.id
      GROUP BY s.id
      HAVING AVG(a.marks / a.total_marks * 100) < 60 OR assessments_taken = 0
      ORDER BY average_percentage ASC
      LIMIT 10
    `).all();

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT
        'task' as type,
        t.title as description,
        u.name as user,
        t.created_at as timestamp
      FROM tasks t
      LEFT JOIN users u ON t.assigned_by = u.id
      UNION ALL
      SELECT
        'announcement' as type,
        a.title as description,
        u.name as user,
        a.created_at as timestamp
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      UNION ALL
      SELECT
        'message' as type,
        SUBSTR(cm.content, 1, 50) as description,
        u.name as user,
        cm.created_at as timestamp
      FROM collab_messages cm
      LEFT JOIN users u ON cm.author_id = u.id
      ORDER BY timestamp DESC
      LIMIT 20
    `).all();

    // General stats
    const generalStats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM student_classes) as total_classes,
        (SELECT COUNT(*) FROM announcements) as total_announcements,
        (SELECT COUNT(*) FROM campaigns) as total_campaigns
    `).get();

    return res.json({
      taskStats,
      teacherAttendanceToday,
      studentAttendanceToday,
      academicConcerns,
      recentActivity,
      generalStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// GET /api/admin/users - Get all users (admins + teachers)
router.get('/users', verifyToken, adminOnly, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, subject, phone, classes, responsibilities, created_at
      FROM users
      ORDER BY role ASC, name ASC
    `).all();

    return res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
