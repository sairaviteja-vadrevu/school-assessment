import express from 'express';
import db from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tasks - Get all tasks with optional filters
router.get('/', verifyToken, (req, res) => {
  try {
    const { status, priority, assigned_to, assigned_by } = req.query;

    let query = `
      SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }
    if (assigned_by) {
      query += ' AND t.assigned_by = ?';
      params.push(assigned_by);
    }

    // Teachers can only see tasks assigned to them
    if (req.user.role === 'teacher') {
      query += ' AND t.assigned_to = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY t.deadline ASC, t.priority DESC';

    const tasks = db.prepare(query).all(...params);
    return res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// POST /api/tasks - Create new task (admin only)
router.post('/', verifyToken, adminOnly, (req, res) => {
  try {
    const { title, description, assigned_to, deadline, priority } = req.body;

    if (!title || !assigned_to) {
      return res.status(400).json({ error: 'Title and assigned_to are required' });
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, assigned_to, assigned_by, deadline, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      assigned_to,
      req.user.id,
      deadline || null,
      priority || 'medium',
      'pending'
    );

    const task = db.prepare(`
      SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, status, priority } = req.body;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Teachers can only update status of their assigned tasks
    if (req.user.role === 'teacher') {
      if (task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (status === undefined) {
        return res.status(400).json({ error: 'Teachers can only update task status' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (deadline !== undefined) {
      updates.push('deadline = ?');
      values.push(deadline);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedTask = db.prepare(`
      SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE t.id = ?
    `).get(id);

    return res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task (admin only)
router.delete('/:id', verifyToken, adminOnly, (req, res) => {
  try {
    const { id } = req.params;

    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
