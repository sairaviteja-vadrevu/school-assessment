import express from 'express';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to calculate grade
function calculateGrade(marks, totalMarks) {
  const percentage = (marks / totalMarks) * 100;

  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

// GET /api/assessments - Get assessments with query filters
router.get('/', verifyToken, async (req, res) => {
  try {
    const { class: classId, subject, exam_type } = req.query;

    let sql = `
      SELECT a.*, s.name as student_name, c.name as class_name, u.name as entered_by_name
      FROM assessments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN student_classes c ON s.class_id = c.id
      LEFT JOIN users u ON a.entered_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (classId) {
      sql += ` AND s.class_id = $${paramIndex++}`;
      params.push(classId);
    }
    if (subject) {
      sql += ` AND a.subject = $${paramIndex++}`;
      params.push(subject);
    }
    if (exam_type) {
      sql += ` AND a.exam_type = $${paramIndex++}`;
      params.push(exam_type);
    }

    // Teachers only see assessments for their assigned classes
    if (req.user.role === 'teacher' && !classId) {
      const userResult = await query('SELECT classes FROM users WHERE id = $1', [req.user.id]);
      const user = userResult.rows[0];
      if (user?.classes) {
        const assignedNames = user.classes.split(',').map(c => c.trim().toLowerCase());
        const classResult = await query('SELECT id, name FROM student_classes');
        const classIds = classResult.rows
          .filter(c => assignedNames.includes(c.name.toLowerCase()))
          .map(c => c.id);
        if (classIds.length > 0) {
          sql += ` AND s.class_id IN (${classIds.join(',')})`;
        }
      }
    }

    sql += ' ORDER BY a.date DESC, s.name ASC';

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get assessments error:', error);
    return res.status(500).json({ error: 'Failed to get assessments' });
  }
});

// POST /api/assessments - Enter marks (bulk)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { subject, total_marks, exam_type, date, assessment_data } = req.body;

    if (!subject || !total_marks || !exam_type || !date || !Array.isArray(assessment_data)) {
      return res.status(400).json({ error: 'subject, total_marks, exam_type, date, and assessment_data array are required' });
    }

    const results = [];
    const errors = [];

    for (const { student_id, marks } of assessment_data) {
      try {
        const grade = calculateGrade(marks, total_marks);

        await query(`
          INSERT INTO assessments (student_id, subject, marks, total_marks, grade, exam_type, date, entered_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [student_id, subject, marks, total_marks, grade, exam_type, date, req.user.id]);

        results.push({ student_id, marks, grade, status: 'success' });
      } catch (err) {
        errors.push({ student_id, error: err.message });
      }
    }

    return res.status(201).json({ success: results, errors });
  } catch (error) {
    console.error('Enter marks error:', error);
    return res.status(500).json({ error: 'Failed to enter marks' });
  }
});

// PUT /api/assessments/:id - Update a single assessment
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, total_marks } = req.body;

    const existingResult = await query('SELECT * FROM assessments WHERE id = $1', [id]);
    const existing = existingResult.rows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const newMarks = marks !== undefined ? marks : existing.marks;
    const newTotal = total_marks !== undefined ? total_marks : existing.total_marks;
    const percentage = (newMarks / newTotal) * 100;
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';

    await query('UPDATE assessments SET marks = $1, total_marks = $2, grade = $3 WHERE id = $4',
      [newMarks, newTotal, grade, id]);

    const updatedResult = await query(`
      SELECT a.*, s.name as student_name, c.name as class_name
      FROM assessments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN student_classes c ON s.class_id = c.id
      WHERE a.id = $1
    `, [id]);

    return res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Update assessment error:', error);
    return res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// DELETE /api/assessments/:id - Delete a single assessment
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existingResult = await query('SELECT id FROM assessments WHERE id = $1', [id]);
    if (!existingResult.rows[0]) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    await query('DELETE FROM assessments WHERE id = $1', [id]);
    return res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// GET /api/assessments/exam-types - Get all distinct exam types used
router.get('/exam-types', verifyToken, async (req, res) => {
  try {
    const result = await query('SELECT DISTINCT exam_type FROM assessments ORDER BY exam_type ASC');
    return res.json(result.rows.map(t => t.exam_type));
  } catch (error) {
    console.error('Get exam types error:', error);
    return res.status(500).json({ error: 'Failed to get exam types' });
  }
});

// GET /api/assessments/student/:student_id - Get assessments for a student
router.get('/student/:student_id', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    const result = await query(`
      SELECT a.*, s.name as student_name, u.name as entered_by_name
      FROM assessments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN users u ON a.entered_by = u.id
      WHERE a.student_id = $1
      ORDER BY a.date DESC
    `, [student_id]);

    return res.json(result.rows);
  } catch (error) {
    console.error('Get student assessments error:', error);
    return res.status(500).json({ error: 'Failed to get assessments' });
  }
});

// GET /api/assessments/class/:class_id - Get assessments for a class
router.get('/class/:class_id', verifyToken, async (req, res) => {
  try {
    const { class_id, subject, exam_type } = req.query;

    let sql = `
      SELECT a.*, s.name as student_name, c.name as class_name, u.name as entered_by_name
      FROM assessments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN student_classes c ON s.class_id = c.id
      LEFT JOIN users u ON a.entered_by = u.id
      WHERE s.class_id = $1
    `;
    const params = [class_id];
    let paramIndex = 2;

    if (subject) {
      sql += ` AND a.subject = $${paramIndex++}`;
      params.push(subject);
    }
    if (exam_type) {
      sql += ` AND a.exam_type = $${paramIndex++}`;
      params.push(exam_type);
    }

    sql += ' ORDER BY s.roll_number ASC, a.date DESC';

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get class assessments error:', error);
    return res.status(500).json({ error: 'Failed to get assessments' });
  }
});

// GET /api/assessments/summary - Get summary with auto-grading
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const { class_id, subject } = req.query;

    let sql = `
      SELECT
        s.id as student_id,
        s.name as student_name,
        c.name as class_name,
        COUNT(DISTINCT a.exam_type) as exams_taken,
        AVG(a.marks / a.total_marks * 100) as average_percentage,
        MAX(a.grade) as highest_grade,
        MIN(a.grade) as lowest_grade
      FROM students s
      LEFT JOIN assessments a ON s.id = a.student_id
      LEFT JOIN student_classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (class_id) {
      sql += ` AND s.class_id = $${paramIndex++}`;
      params.push(class_id);
    }

    if (subject) {
      sql += ` AND a.subject = $${paramIndex++}`;
      params.push(subject);
    }

    sql += ' GROUP BY s.id, s.name, c.name ORDER BY s.roll_number ASC';

    const result = await query(sql, params);

    // Calculate overall grade
    const summaryWithGrades = result.rows.map(record => {
      let overallGrade = 'N/A';
      if (record.average_percentage !== null) {
        overallGrade = calculateGrade(record.average_percentage, 100);
      }
      return { ...record, overall_grade: overallGrade };
    });

    return res.json(summaryWithGrades);
  } catch (error) {
    console.error('Get summary error:', error);
    return res.status(500).json({ error: 'Failed to get summary' });
  }
});

export default router;
