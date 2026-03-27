import express from 'express';
import db from '../db.js';
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

// POST /api/assessments - Enter marks (bulk)
router.post('/', verifyToken, (req, res) => {
  try {
    const { subject, total_marks, exam_type, date, assessment_data } = req.body;

    if (!subject || !total_marks || !exam_type || !date || !Array.isArray(assessment_data)) {
      return res.status(400).json({ error: 'subject, total_marks, exam_type, date, and assessment_data array are required' });
    }

    const results = [];
    const errors = [];

    assessment_data.forEach(({ student_id, marks }) => {
      try {
        const grade = calculateGrade(marks, total_marks);

        db.prepare(`
          INSERT INTO assessments (student_id, subject, marks, total_marks, grade, exam_type, date, entered_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(student_id, subject, marks, total_marks, grade, exam_type, date, req.user.id);

        results.push({ student_id, marks, grade, status: 'success' });
      } catch (err) {
        errors.push({ student_id, error: err.message });
      }
    });

    return res.status(201).json({ success: results, errors });
  } catch (error) {
    console.error('Enter marks error:', error);
    return res.status(500).json({ error: 'Failed to enter marks' });
  }
});

// GET /api/assessments/student/:student_id - Get assessments for a student
router.get('/student/:student_id', verifyToken, (req, res) => {
  try {
    const { student_id } = req.params;

    const assessments = db.prepare(`
      SELECT a.*, s.name as student_name, u.name as entered_by_name
      FROM assessments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN users u ON a.entered_by = u.id
      WHERE a.student_id = ?
      ORDER BY a.date DESC
    `).all(student_id);

    return res.json(assessments);
  } catch (error) {
    console.error('Get student assessments error:', error);
    return res.status(500).json({ error: 'Failed to get assessments' });
  }
});

// GET /api/assessments/class/:class_id - Get assessments for a class
router.get('/class/:class_id', verifyToken, (req, res) => {
  try {
    const { class_id, subject, exam_type } = req.query;

    let query = `
      SELECT a.*, s.name as student_name, c.name as class_name, u.name as entered_by_name
      FROM assessments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN student_classes c ON s.class_id = c.id
      LEFT JOIN users u ON a.entered_by = u.id
      WHERE s.class_id = ?
    `;
    const params = [class_id];

    if (subject) {
      query += ' AND a.subject = ?';
      params.push(subject);
    }
    if (exam_type) {
      query += ' AND a.exam_type = ?';
      params.push(exam_type);
    }

    query += ' ORDER BY s.roll_number ASC, a.date DESC';

    const assessments = db.prepare(query).all(...params);
    return res.json(assessments);
  } catch (error) {
    console.error('Get class assessments error:', error);
    return res.status(500).json({ error: 'Failed to get assessments' });
  }
});

// GET /api/assessments/summary - Get summary with auto-grading
router.get('/summary', verifyToken, (req, res) => {
  try {
    const { class_id, subject } = req.query;

    let query = `
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

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (subject) {
      query += ' AND a.subject = ?';
      params.push(subject);
    }

    query += ' GROUP BY s.id ORDER BY s.roll_number ASC';

    const summary = db.prepare(query).all(...params);

    // Calculate overall grade
    const summaryWithGrades = summary.map(record => {
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
