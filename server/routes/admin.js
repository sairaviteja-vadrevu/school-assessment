import express from 'express';
import { query } from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/dashboard - Admin dashboard stats
router.get('/dashboard', verifyToken, adminOnly, async (req, res) => {
  try {
    // Task completion rates
    const taskStatsResult = await query(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as completion_rate
      FROM tasks
    `);
    const taskStats = taskStatsResult.rows[0];

    // Attendance summaries
    const teacherAttendanceResult = await query(`
      SELECT
        COUNT(*) as total_teachers,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
      FROM teacher_attendance
      WHERE date = CURRENT_DATE
    `);
    const teacherAttendanceToday = teacherAttendanceResult.rows[0];

    const studentAttendanceResult = await query(`
      SELECT
        COUNT(*) as total_students,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
      FROM student_attendance
      WHERE date = CURRENT_DATE
    `);
    const studentAttendanceToday = studentAttendanceResult.rows[0];

    // Student academic concerns (low grades)
    const academicConcernsResult = await query(`
      SELECT
        s.id,
        s.name,
        c.name as class_name,
        COUNT(DISTINCT a.id) as assessments_taken,
        ROUND(AVG(a.marks / a.total_marks * 100), 2) as average_percentage,
        STRING_AGG(DISTINCT a.grade, ',') as grades
      FROM students s
      LEFT JOIN assessments a ON s.id = a.student_id
      LEFT JOIN student_classes c ON s.class_id = c.id
      GROUP BY s.id, s.name, c.name
      HAVING AVG(a.marks / a.total_marks * 100) < 60 OR COUNT(DISTINCT a.id) = 0
      ORDER BY average_percentage ASC
      LIMIT 10
    `);
    const academicConcerns = academicConcernsResult.rows;

    // Recent activity
    const recentActivityResult = await query(`
      SELECT * FROM (
        SELECT
          'task' as type,
          t.title as description,
          u.name as "user",
          t.created_at as timestamp
        FROM tasks t
        LEFT JOIN users u ON t.assigned_by = u.id
        UNION ALL
        SELECT
          'announcement' as type,
          a.title as description,
          u.name as "user",
          a.created_at as timestamp
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        UNION ALL
        SELECT
          'message' as type,
          SUBSTRING(cm.content, 1, 50) as description,
          u.name as "user",
          cm.created_at as timestamp
        FROM collab_messages cm
        LEFT JOIN users u ON cm.author_id = u.id
      ) combined
      ORDER BY timestamp DESC
      LIMIT 20
    `);
    const recentActivity = recentActivityResult.rows;

    // General stats
    const generalStatsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM student_classes) as total_classes,
        (SELECT COUNT(*) FROM announcements) as total_announcements,
        (SELECT COUNT(*) FROM campaigns) as total_campaigns
    `);
    const generalStats = generalStatsResult.rows[0];

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
router.get('/stats', verifyToken, adminOnly, async (req, res) => {
  try {
    const totalTeachersResult = await query('SELECT COUNT(*) as c FROM users WHERE role = $1', ['teacher']);
    const totalTeachers = totalTeachersResult.rows[0].c;

    const totalStudentsResult = await query('SELECT COUNT(*) as c FROM students');
    const totalStudents = totalStudentsResult.rows[0].c;

    const taskStatsResult = await query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
    `);
    const taskStats = taskStatsResult.rows[0];
    const taskCompletionRate = taskStats.total > 0 ? Math.round(100 * taskStats.completed / taskStats.total) : 0;

    const today = new Date().toISOString().split('T')[0];
    const attendedResult = await query(
      `SELECT COUNT(*) as c FROM teacher_attendance WHERE date = $1 AND status IN ('present', 'late')`,
      [today]
    );
    const attended = attendedResult.rows[0].c;
    const attendanceRate = totalTeachers > 0 ? Math.round(100 * attended / totalTeachers) : 0;

    return res.json({ totalTeachers, totalStudents, taskCompletionRate, attendanceRate });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/admin/teacher-progress - Teacher task completion rates
router.get('/teacher-progress', verifyToken, adminOnly, async (req, res) => {
  try {
    const teachersResult = await query(`
      SELECT u.id, u.name,
        COUNT(t.id) as "totalTasks",
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as "tasksCompleted"
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.name
      ORDER BY u.name ASC
    `);

    const result = teachersResult.rows.map((t) => ({
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
router.get('/attendance-summary', verifyToken, adminOnly, async (req, res) => {
  try {
    const summaryResult = await query(`
      SELECT
        c.name as "className",
        COUNT(sa.id) as total,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as "presentCount",
        SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as "absentCount"
      FROM student_classes c
      LEFT JOIN student_attendance sa ON sa.class_id = c.id AND sa.date = CURRENT_DATE
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `);

    const result = summaryResult.rows.map((s) => ({
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
router.get('/weak-students', verifyToken, adminOnly, async (req, res) => {
  try {
    const studentsResult = await query(`
      SELECT
        s.name as "studentName",
        c.name as "className",
        ROUND(AVG(a.marks / a.total_marks * 100), 1) as "averageScore",
        STRING_AGG(DISTINCT CASE WHEN (a.marks / a.total_marks * 100) < 40 THEN a.subject END, ',') as "subjectsBelow40"
      FROM students s
      JOIN assessments a ON s.id = a.student_id
      LEFT JOIN student_classes c ON s.class_id = c.id
      GROUP BY s.id, s.name, c.name
      HAVING ROUND(AVG(a.marks / a.total_marks * 100), 1) < 40
      ORDER BY "averageScore" ASC
    `);

    return res.json(studentsResult.rows);
  } catch (error) {
    console.error('Weak students error:', error);
    return res.status(500).json({ error: 'Failed to get weak students' });
  }
});

// GET /api/admin/recent-activity - Recent collaboration activity
router.get('/recent-activity', verifyToken, adminOnly, async (req, res) => {
  try {
    const activityResult = await query(`
      SELECT
        'message' as type,
        r.name as title,
        u.name || ': ' || SUBSTRING(cm.content, 1, 60) as description,
        cm.created_at as timestamp
      FROM collab_messages cm
      LEFT JOIN users u ON cm.author_id = u.id
      LEFT JOIN collab_rooms r ON cm.room_id = r.id
      ORDER BY cm.created_at DESC
      LIMIT 10
    `);

    const now = Date.now();
    const result = activityResult.rows.map((a) => {
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
router.get('/campaign-summary', verifyToken, adminOnly, async (req, res) => {
  try {
    const summaryResult = await query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as "inProgress",
        SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned
      FROM campaigns
    `);

    return res.json(summaryResult.rows[0]);
  } catch (error) {
    console.error('Campaign summary error:', error);
    return res.status(500).json({ error: 'Failed to get campaign summary' });
  }
});

// GET /api/admin/users - Get all users (admins + teachers)
router.get('/users', verifyToken, adminOnly, async (req, res) => {
  try {
    const usersResult = await query(`
      SELECT id, name, email, role, subject, phone, classes, responsibilities, created_at
      FROM users
      ORDER BY role ASC, name ASC
    `);

    return res.json(usersResult.rows);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to get users' });
  }
});

// DELETE /api/admin/users/:id - Delete a user (admin only)
router.delete('/users/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const userResult = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all related records first (order matters for foreign keys)
    await query('DELETE FROM collab_messages WHERE room_id IN (SELECT id FROM collab_rooms WHERE created_by = $1)', [id]);
    await query('DELETE FROM collab_messages WHERE author_id = $1', [id]);
    await query('DELETE FROM collab_rooms WHERE created_by = $1', [id]);
    await query('DELETE FROM teacher_attendance WHERE user_id = $1', [id]);
    await query('DELETE FROM student_attendance WHERE marked_by = $1', [id]);
    await query('DELETE FROM assessments WHERE entered_by = $1', [id]);
    await query('DELETE FROM tasks WHERE assigned_to = $1 OR assigned_by = $1', [id]);
    await query('DELETE FROM announcements WHERE author_id = $1', [id]);
    await query('DELETE FROM campaigns WHERE created_by = $1', [id]);
    await query('UPDATE campaigns SET assigned_to = NULL WHERE assigned_to = $1', [id]);
    await query('DELETE FROM users WHERE id = $1', [id]);

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
