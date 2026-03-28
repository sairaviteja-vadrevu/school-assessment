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

// GET /api/admin/stats - Key stats for admin panel
router.get('/stats', verifyToken, adminOnly, (req, res) => {
  try {
    const totalTeachers = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('teacher').c;
    const totalStudents = db.prepare('SELECT COUNT(*) as c FROM students').get().c;

    const taskStats = db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
    `).get();
    const taskCompletionRate = taskStats.total > 0 ? Math.round(100 * taskStats.completed / taskStats.total) : 0;

    const today = new Date().toISOString().split('T')[0];
    const attended = db.prepare(`
      SELECT COUNT(*) as c FROM teacher_attendance WHERE date = ? AND status IN ('present', 'late')
    `).get(today).c;
    const attendanceRate = totalTeachers > 0 ? Math.round(100 * attended / totalTeachers) : 0;

    return res.json({ totalTeachers, totalStudents, taskCompletionRate, attendanceRate });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/admin/teacher-progress - Teacher task completion rates
router.get('/teacher-progress', verifyToken, adminOnly, (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT u.id, u.name,
        COUNT(t.id) as totalTasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as tasksCompleted
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY u.name ASC
    `).all();

    const result = teachers.map((t) => ({
      ...t,
      completionRate: t.totalTasks > 0 ? Math.round(100 * t.tasksCompleted / t.totalTasks) : 0,
    }));

    return res.json(result);
  } catch (error) {
    console.error('Teacher progress error:', error);
    return res.status(500).json({ error: 'Failed to get teacher progress' });
  }
});

// GET /api/admin/attendance-summary - Class-wise attendance summary
router.get('/attendance-summary', verifyToken, adminOnly, (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT
        c.name as className,
        COUNT(sa.id) as total,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as absentCount
      FROM student_classes c
      LEFT JOIN student_attendance sa ON sa.class_id = c.id AND sa.date = DATE('now')
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    const result = summary.map((s) => ({
      ...s,
      attendanceRate: s.total > 0 ? Math.round(100 * s.presentCount / s.total) : 0,
    }));

    return res.json(result);
  } catch (error) {
    console.error('Attendance summary error:', error);
    return res.status(500).json({ error: 'Failed to get attendance summary' });
  }
});

// GET /api/admin/weak-students - Students below 40%
router.get('/weak-students', verifyToken, adminOnly, (req, res) => {
  try {
    const students = db.prepare(`
      SELECT
        s.name as studentName,
        c.name as className,
        ROUND(AVG(a.marks / a.total_marks * 100), 1) as averageScore,
        GROUP_CONCAT(DISTINCT CASE WHEN (a.marks / a.total_marks * 100) < 40 THEN a.subject END) as subjectsBelow40
      FROM students s
      JOIN assessments a ON s.id = a.student_id
      LEFT JOIN student_classes c ON s.class_id = c.id
      GROUP BY s.id
      HAVING averageScore < 40
      ORDER BY averageScore ASC
    `).all();

    return res.json(students);
  } catch (error) {
    console.error('Weak students error:', error);
    return res.status(500).json({ error: 'Failed to get weak students' });
  }
});

// GET /api/admin/recent-activity - Recent collaboration activity
router.get('/recent-activity', verifyToken, adminOnly, (req, res) => {
  try {
    const activity = db.prepare(`
      SELECT
        'message' as type,
        r.name as title,
        u.name || ': ' || SUBSTR(cm.content, 1, 60) as description,
        cm.created_at as timestamp
      FROM collab_messages cm
      LEFT JOIN users u ON cm.author_id = u.id
      LEFT JOIN collab_rooms r ON cm.room_id = r.id
      ORDER BY cm.created_at DESC
      LIMIT 10
    `).all();

    const now = Date.now();
    const result = activity.map((a) => {
      const diff = now - new Date(a.timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      const timeAgo = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : `${mins}m ago`;
      return { ...a, timeAgo };
    });

    return res.json(result);
  } catch (error) {
    console.error('Recent activity error:', error);
    return res.status(500).json({ error: 'Failed to get recent activity' });
  }
});

// GET /api/admin/campaign-summary - Campaign stats
router.get('/campaign-summary', verifyToken, adminOnly, (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned
      FROM campaigns
    `).get();

    return res.json(summary);
  } catch (error) {
    console.error('Campaign summary error:', error);
    return res.status(500).json({ error: 'Failed to get campaign summary' });
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

// DELETE /api/admin/users/:id - Delete a user (admin only)
router.delete('/users/:id', verifyToken, adminOnly, (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
