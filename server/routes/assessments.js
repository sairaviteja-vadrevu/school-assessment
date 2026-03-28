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

// GET /api/assessments - Get assessments with query filters
router.get('/', verifyToken, (req, res) => {
  try {
    const { class: classId, subject, exam_type } = req.query;

    let query = `
      SELECT a.*, s.name as student_name, c.name as class_name, u.name as entered_by_name
      FROM assessments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN student_classes c ON s.class_id = c.id
      LEFT JOIN users u ON a.entered_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (classId) {
      query += ' AND s.class_id = ?';
      params.push(classId);
    }
    if (subject) {
      query += ' AND a.subject = ?';
      params.push(subject);
    }
    if (exam_type) {
      query += ' AND a.exam_type = ?';
      params.push(exam_type);
    }

    // Teachers only see assessments for their assigned classes
    if (req.user.role === 'teacher' && !classId) {
      const user = db.prepare('SELECT classes FROM users WHERE id = ?').get(req.user.id);
      if (user?.classes) {
        const assignedNames = user.classes.split(',').map(c => c.trim().toLowerCase());
        const classIds = db.prepare('SELECT id FROM student_classes').all()
          .filter(c => {
            const cls = db.prepare('SELECT name FROM student_classes WHERE id = ?').get(c.id);
            return assignedNames.includes(cls.name.toLowerCase());
          }).map(c => c.id);
        if (classIds.length > 0) {
          query += ` AND s.class_id IN (${classIds.join(',')})`;
        }
      }
    }

    query += ' ORDER BY a.date DESC, s.name ASC';

    const assessments = db.prepare(query).all(...params);
    return res.json(assessments);
  } catch (error) {
    console.error('Get assessments error:', error);
    return res.status(500).json({ error: 'Failed to get assessments' });
  }
});

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

// PUT /api/assessments/:id - Update a single assessment
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { marks, total_marks } = req.body;

    const existing = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const newMarks = marks !== undefined ? marks : existing.marks;
    const newTotal = total_marks !== undefined ? total_marks : existing.total_marks;
    const percentage = (newMarks / newTotal) * 100;
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';

    db.prepare('UPDATE assessments SET marks = ?, total_marks = ?, grade = ? WHERE id = ?')
      .run(newMarks, newTotal, grade, id);

    const updated = db.prepare(`
      SELECT a.*, s.name as student_name, c.name as class_name
      FROM assessments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN student_classes c ON s.class_id = c.id
      WHERE a.id = ?
    `).get(id);

    return res.json(updated);
  } catch (error) {
    console.error('Update assessment error:', error);
    return res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// DELETE /api/assessments/:id - Delete a single assessment
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM assessments WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    db.prepare('DELETE FROM assessments WHERE id = ?').run(id);
    return res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// GET /api/assessments/exam-types - Get all distinct exam types used
router.get('/exam-types', verifyToken, (req, res) => {
  try {
    const types = db.prepare('SELECT DISTINCT exam_type FROM assessments ORDER BY exam_type ASC').all();
    return res.json(types.map(t => t.exam_type));
  } catch (error) {
    console.error('Get exam types error:', error);
    return res.status(500).json({ error: 'Failed to get exam types' });
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
