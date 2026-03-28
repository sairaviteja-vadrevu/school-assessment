import express from 'express';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/students - Get all students with their class info
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
      FROM students s
      JOIN student_classes c ON s.class_id = c.id
      ORDER BY c.grade ASC, c.name ASC, s.roll_number ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ error: 'Failed to get students' });
  }
});

// GET /api/students/:id - Get single student with class info
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
      FROM students s
      JOIN student_classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get student error:', error);
    return res.status(500).json({ error: 'Failed to get student' });
  }
});

// POST /api/students - Create new student
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, class_id, roll_number } = req.body;

    if (!name || !class_id || roll_number === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, class_id, roll_number' });
    }

    // Validate class_id exists
    const classResult = await query('SELECT id FROM student_classes WHERE id = $1', [class_id]);

    if (!classResult.rows[0]) {
      return res.status(400).json({ error: 'Class not found' });
    }

    const insertResult = await query(`
      INSERT INTO students (name, class_id, roll_number)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [name, class_id, roll_number]);

    const newId = insertResult.rows[0].id;

    const studentResult = await query(`
      SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
      FROM students s
      JOIN student_classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [newId]);

    return res.status(201).json(studentResult.rows[0]);
  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ error: 'Failed to create student' });
  }
});

// POST /api/students/bulk - Create multiple students at once
router.post('/bulk', verifyToken, async (req, res) => {
  try {
    const { students: studentsData } = req.body;

    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return res.status(400).json({ error: 'Invalid request: provide array of students' });
    }

    // Validate all records before inserting
    const errors = [];
    const classIds = new Set();

    for (let i = 0; i < studentsData.length; i++) {
      const { name, class_id, roll_number } = studentsData[i];

      if (!name || !class_id || roll_number === undefined) {
        errors.push(`Record ${i}: Missing required fields`);
      }

      classIds.add(class_id);
    }

    // Check all class_ids exist
    for (const classId of classIds) {
      const classResult = await query('SELECT id FROM student_classes WHERE id = $1', [classId]);
      if (!classResult.rows[0]) {
        errors.push(`Class ${classId} not found`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Insert all students
    const createdStudents = [];

    for (const { name, class_id, roll_number } of studentsData) {
      const insertResult = await query(`
        INSERT INTO students (name, class_id, roll_number)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [name, class_id, roll_number]);

      const newId = insertResult.rows[0].id;

      const studentResult = await query(`
        SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
        FROM students s
        JOIN student_classes c ON s.class_id = c.id
        WHERE s.id = $1
      `, [newId]);

      createdStudents.push(studentResult.rows[0]);
    }

    return res.status(201).json(createdStudents);
  } catch (error) {
    console.error('Bulk create students error:', error);
    return res.status(500).json({ error: 'Failed to create students' });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, class_id, roll_number } = req.body;

    const studentResult = await query('SELECT id FROM students WHERE id = $1', [id]);

    if (!studentResult.rows[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (class_id !== undefined) {
      // Validate class_id exists
      const classResult = await query('SELECT id FROM student_classes WHERE id = $1', [class_id]);
      if (!classResult.rows[0]) {
        return res.status(400).json({ error: 'Class not found' });
      }
      updates.push(`class_id = $${paramIndex++}`);
      values.push(class_id);
    }
    if (roll_number !== undefined) {
      updates.push(`roll_number = $${paramIndex++}`);
      values.push(roll_number);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE students SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const updatedResult = await query(`
      SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
      FROM students s
      JOIN student_classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [id]);

    return res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Update student error:', error);
    return res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id - Delete student (only if no attendance/assessment records)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const studentResult = await query('SELECT id FROM students WHERE id = $1', [id]);

    if (!studentResult.rows[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check for attendance records
    const attendanceResult = await query('SELECT COUNT(*) as count FROM student_attendance WHERE student_id = $1', [id]);

    if (attendanceResult.rows[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete student with attendance records' });
    }

    // Check for assessment records
    const assessmentResult = await query('SELECT COUNT(*) as count FROM assessments WHERE student_id = $1', [id]);

    if (assessmentResult.rows[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete student with assessment records' });
    }

    await query('DELETE FROM students WHERE id = $1', [id]);

    return res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;
