import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/classes - Get classes (filtered by teacher's assigned classes for non-admins)
router.get('/', verifyToken, (req, res) => {
  try {
    let classes = db.prepare(`
      SELECT sc.id, sc.name, sc.section, sc.grade,
        (SELECT COUNT(*) FROM students WHERE class_id = sc.id) as studentCount
      FROM student_classes sc
      ORDER BY sc.grade ASC, sc.name ASC
    `).all();

    // Teachers only see their assigned classes
    if (req.user.role === 'teacher') {
      const user = db.prepare('SELECT classes FROM users WHERE id = ?').get(req.user.id);
      if (user?.classes) {
        const assignedNames = user.classes.split(',').map(c => c.trim().toLowerCase());
        const filtered = classes.filter(cls => assignedNames.includes(cls.name.toLowerCase()));
        // If assigned classes exist in DB, return only those; otherwise return all as fallback
        if (filtered.length > 0) classes = filtered;
      }
    }

    return res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    return res.status(500).json({ error: 'Failed to get classes' });
  }
});

// GET /api/classes/:id - Get class by ID with student count
router.get('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const classData = db.prepare(`
      SELECT id, name, section, grade
      FROM student_classes
      WHERE id = ?
    `).get(id);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM students
      WHERE class_id = ?
    `).get(id);

    return res.json({
      ...classData,
      studentCount: studentCount.count
    });
  } catch (error) {
    console.error('Get class error:', error);
    return res.status(500).json({ error: 'Failed to get class' });
  }
});

// POST /api/classes - Create new class (admin only)
router.post('/', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, section, grade } = req.body;

    if (!name || !section || grade === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, section, grade' });
    }

    const result = db.prepare(`
      INSERT INTO student_classes (name, section, grade)
      VALUES (?, ?, ?)
    `).run(name, section, grade);

    const newClass = db.prepare(`
      SELECT id, name, section, grade
      FROM student_classes
      WHERE id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    return res.status(500).json({ error: 'Failed to create class' });
  }
});

// PUT /api/classes/:id - Update class (admin only)
router.put('/:id', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { name, section, grade } = req.body;

    const classData = db.prepare('SELECT id FROM student_classes WHERE id = ?').get(id);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (section !== undefined) {
      updates.push('section = ?');
      values.push(section);
    }
    if (grade !== undefined) {
      updates.push('grade = ?');
      values.push(grade);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    db.prepare(`UPDATE student_classes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedClass = db.prepare(`
      SELECT id, name, section, grade
      FROM student_classes
      WHERE id = ?
    `).get(id);

    return res.json(updatedClass);
  } catch (error) {
    console.error('Update class error:', error);
    return res.status(500).json({ error: 'Failed to update class' });
  }
});

// DELETE /api/classes/:id - Delete class (admin only, only if no students)
router.delete('/:id', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    const classData = db.prepare('SELECT id FROM student_classes WHERE id = ?').get(id);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE class_id = ?').get(id);

    if (studentCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete class with students' });
    }

    db.prepare('DELETE FROM student_classes WHERE id = ?').run(id);

    return res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    return res.status(500).json({ error: 'Failed to delete class' });
  }
});

// GET /api/classes/:id/students - Get students in a class
router.get('/:id/students', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const classData = db.prepare('SELECT id FROM student_classes WHERE id = ?').get(id);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const students = db.prepare(`
      SELECT id, name, class_id, roll_number
      FROM students
      WHERE class_id = ?
      ORDER BY roll_number ASC
    `).all(id);

    return res.json(students);
  } catch (error) {
    console.error('Get class students error:', error);
    return res.status(500).json({ error: 'Failed to get class students' });
  }
});

// GET /api/classes/:id/subjects - Get subjects for a class
router.get('/:id/subjects', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const classData = db.prepare('SELECT id FROM student_classes WHERE id = ?').get(id);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const subjects = [
      'Math',
      'Science',
      'English',
      'Hindi',
      'Telugu',
      'Social Studies',
      'Computer Science'
    ];

    return res.json(subjects);
  } catch (error) {
    console.error('Get class subjects error:', error);
    return res.status(500).json({ error: 'Failed to get class subjects' });
  }
});

export default router;
