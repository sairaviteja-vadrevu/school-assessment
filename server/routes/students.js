import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/students - Get all students with their class info
router.get('/', verifyToken, (req, res) => {
  try {
    const students = db.prepare(`
      SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
      FROM students s
      JOIN student_classes c ON s.class_id = c.id
      ORDER BY c.grade ASC, c.name ASC, s.roll_number ASC
    `).all();

    return res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ error: 'Failed to get students' });
  }
});

// GET /api/students/:id - Get single student with class info
router.get('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const student = db.prepare(`
      SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
      FROM students s
      JOIN student_classes c ON s.class_id = c.id
      WHERE s.id = ?
    `).get(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    return res.status(500).json({ error: 'Failed to get student' });
  }
});

// POST /api/students - Create new student
router.post('/', verifyToken, (req, res) => {
  try {
    const { name, class_id, roll_number } = req.body;

    if (!name || !class_id || roll_number === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, class_id, roll_number' });
    }

    // Validate class_id exists
    const classData = db.prepare('SELECT id FROM student_classes WHERE id = ?').get(class_id);

    if (!classData) {
      return res.status(400).json({ error: 'Class not found' });
    }

    const result = db.prepare(`
      INSERT INTO students (name, class_id, roll_number)
      VALUES (?, ?, ?)
    `).run(name, class_id, roll_number);

    const newStudent = db.prepare(`
      SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
      FROM students s
      JOIN student_classes c ON s.class_id = c.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(newStudent);
  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ error: 'Failed to create student' });
  }
});

// POST /api/students/bulk - Create multiple students at once
router.post('/bulk', verifyToken, (req, res) => {
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
      const classData = db.prepare('SELECT id FROM student_classes WHERE id = ?').get(classId);
      if (!classData) {
        errors.push(`Class ${classId} not found`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Insert all students
    const createdStudents = [];
    const insertStmt = db.prepare(`
      INSERT INTO students (name, class_id, roll_number)
      VALUES (?, ?, ?)
    `);

    for (const { name, class_id, roll_number } of studentsData) {
      const result = insertStmt.run(name, class_id, roll_number);

      const student = db.prepare(`
        SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
        FROM students s
        JOIN student_classes c ON s.class_id = c.id
        WHERE s.id = ?
      `).get(result.lastInsertRowid);

      createdStudents.push(student);
    }

    return res.status(201).json(createdStudents);
  } catch (error) {
    console.error('Bulk create students error:', error);
    return res.status(500).json({ error: 'Failed to create students' });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, class_id, roll_number } = req.body;

    const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (class_id !== undefined) {
      // Validate class_id exists
      const classData = db.prepare('SELECT id FROM student_classes WHERE id = ?').get(class_id);
      if (!classData) {
        return res.status(400).json({ error: 'Class not found' });
      }
      updates.push('class_id = ?');
      values.push(class_id);
    }
    if (roll_number !== undefined) {
      updates.push('roll_number = ?');
      values.push(roll_number);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    db.prepare(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedStudent = db.prepare(`
      SELECT s.id, s.name, s.class_id, s.roll_number, c.name as class_name, c.section, c.grade
      FROM students s
      JOIN student_classes c ON s.class_id = c.id
      WHERE s.id = ?
    `).get(id);

    return res.json(updatedStudent);
  } catch (error) {
    console.error('Update student error:', error);
    return res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id - Delete student (only if no attendance/assessment records)
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check for attendance records
    const attendanceCount = db.prepare('SELECT COUNT(*) as count FROM student_attendance WHERE student_id = ?').get(id);

    if (attendanceCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete student with attendance records' });
    }

    // Check for assessment records
    const assessmentCount = db.prepare('SELECT COUNT(*) as count FROM assessments WHERE student_id = ?').get(id);

    if (assessmentCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete student with assessment records' });
    }

    db.prepare('DELETE FROM students WHERE id = ?').run(id);

    return res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;
