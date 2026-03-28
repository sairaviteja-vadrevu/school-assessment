import express from 'express';
import { query } from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tasks - Get all tasks with optional filters
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, priority, assigned_to, assigned_by } = req.query;

    let sql = `
      SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND t.priority = $${paramCount++}`;
      params.push(priority);
    }
    if (assigned_to) {
      sql += ` AND t.assigned_to = $${paramCount++}`;
      params.push(assigned_to);
    }
    if (assigned_by) {
      sql += ` AND t.assigned_by = $${paramCount++}`;
      params.push(assigned_by);
    }

    // Teachers can only see tasks assigned to them
    if (req.user.role === 'teacher') {
      sql += ` AND t.assigned_to = $${paramCount++}`;
      params.push(req.user.id);
    }

    sql += ' ORDER BY t.deadline ASC, t.priority DESC';

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// POST /api/tasks - Create new task (admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { title, description, assigned_to, deadline, priority } = req.body;

    if (!title || !assigned_to) {
      return res.status(400).json({ error: 'Title and assigned_to are required' });
    }

    const insertResult = await query(`
      INSERT INTO tasks (title, description, assigned_to, assigned_by, deadline, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      title,
      description || null,
      assigned_to,
      req.user.id,
      deadline || null,
      priority || 'medium',
      'pending'
    ]);

    const newTaskId = insertResult.rows[0].id;

    const taskResult = await query(`
      SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE t.id = $1
    `, [newTaskId]);

    return res.status(201).json(taskResult.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, status, priority } = req.body;

    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

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
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (deadline !== undefined) {
      updates.push(`deadline = $${paramCount++}`);
      values.push(deadline);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount}`, values);

    const updatedResult = await query(`
      SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE t.id = $1
    `, [id]);

    return res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task (admin only)
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const taskResult = await query('SELECT id FROM tasks WHERE id = $1', [id]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await query('DELETE FROM tasks WHERE id = $1', [id]);

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
