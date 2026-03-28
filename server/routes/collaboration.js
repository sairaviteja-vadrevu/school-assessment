import express from 'express';
import { query, pool } from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ============ ROOMS ============

// GET /api/collaboration/rooms - Get rooms (filtered by membership for teachers)
router.get('/rooms', verifyToken, async (req, res) => {
  try {
    let result;

    if (req.user.role === 'admin') {
      result = await query(`
        SELECT r.*, u.name as created_by_name,
          (SELECT COUNT(*) FROM collab_messages WHERE room_id = r.id) as message_count,
          (SELECT COUNT(*) FROM collab_notifications WHERE room_id = r.id AND user_id = $1 AND is_read = 0) as unread_count
        FROM collab_rooms r
        LEFT JOIN users u ON r.created_by = u.id
        ORDER BY r.created_at DESC
      `, [req.user.id]);
    } else {
      result = await query(`
        SELECT r.*, u.name as created_by_name,
          (SELECT COUNT(*) FROM collab_messages WHERE room_id = r.id) as message_count,
          (SELECT COUNT(*) FROM collab_notifications WHERE room_id = r.id AND user_id = $1 AND is_read = 0) as unread_count
        FROM collab_rooms r
        LEFT JOIN users u ON r.created_by = u.id
        INNER JOIN collab_room_members m ON m.room_id = r.id AND m.user_id = $2
        ORDER BY r.created_at DESC
      `, [req.user.id, req.user.id]);
    }

    return res.json(result.rows);
  } catch (error) {
    console.error('Get rooms error:', error);
    return res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// POST /api/collaboration/rooms - Create room (admin only) with members
router.post('/rooms', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, description, type, member_ids } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const validTypes = ['department', 'academic', 'event', 'general'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const client = await pool.connect();
    let roomId;
    try {
      await client.query('BEGIN');

      const insertResult = await client.query(`
        INSERT INTO collab_rooms (name, description, type, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [name, description || null, type, req.user.id]);

      roomId = insertResult.rows[0].id;

      // Always add creator as member
      await client.query('INSERT INTO collab_room_members (room_id, user_id) VALUES ($1, $2)', [roomId, req.user.id]);

      // Add invited members
      if (Array.isArray(member_ids)) {
        for (const userId of member_ids) {
          await client.query('INSERT INTO collab_room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roomId, userId]);
        }
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const roomResult = await query(`
      SELECT r.*, u.name as created_by_name
      FROM collab_rooms r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `, [roomId]);

    return res.status(201).json(roomResult.rows[0]);
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/collaboration/rooms/:room_id/members - Get room members
router.get('/rooms/:room_id/members', verifyToken, async (req, res) => {
  try {
    const { room_id } = req.params;
    const result = await query(`
      SELECT u.id, u.name, u.email, u.role, u.subject, m.joined_at
      FROM collab_room_members m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = $1
      ORDER BY u.name ASC
    `, [room_id]);

    return res.json(result.rows);
  } catch (error) {
    console.error('Get room members error:', error);
    return res.status(500).json({ error: 'Failed to get room members' });
  }
});

// POST /api/collaboration/rooms/:room_id/members - Add members (admin only)
router.post('/rooms/:room_id/members', verifyToken, adminOnly, async (req, res) => {
  try {
    const { room_id } = req.params;
    const { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }

    for (const userId of user_ids) {
      await query('INSERT INTO collab_room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [room_id, userId]);
    }

    return res.json({ message: 'Members added successfully' });
  } catch (error) {
    console.error('Add members error:', error);
    return res.status(500).json({ error: 'Failed to add members' });
  }
});

// ============ MESSAGES ============

// GET /api/collaboration/messages/:room_id - Get messages
router.get('/messages/:room_id', verifyToken, async (req, res) => {
  try {
    const { room_id } = req.params;

    // Verify room exists
    const roomResult = await query('SELECT id FROM collab_rooms WHERE id = $1', [room_id]);
    if (!roomResult.rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check membership (admins bypass)
    if (req.user.role !== 'admin') {
      const memberResult = await query('SELECT id FROM collab_room_members WHERE room_id = $1 AND user_id = $2', [room_id, req.user.id]);
      if (!memberResult.rows[0]) {
        return res.status(403).json({ error: 'Not a member of this room' });
      }
    }

    const result = await query(`
      SELECT m.*, u.name as author_name
      FROM collab_messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.room_id = $1
      ORDER BY m.created_at ASC
    `, [room_id]);

    return res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Failed to get messages' });
  }
});

// POST /api/collaboration/messages - Send message + create notifications
router.post('/messages', verifyToken, async (req, res) => {
  try {
    const { room_id, content, parent_id } = req.body;

    if (!room_id || !content) {
      return res.status(400).json({ error: 'Room ID and content are required' });
    }

    // Verify room exists
    const roomResult = await query('SELECT id FROM collab_rooms WHERE id = $1', [room_id]);
    if (!roomResult.rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check membership (admins bypass)
    if (req.user.role !== 'admin') {
      const memberResult = await query('SELECT id FROM collab_room_members WHERE room_id = $1 AND user_id = $2', [room_id, req.user.id]);
      if (!memberResult.rows[0]) {
        return res.status(403).json({ error: 'Not a member of this room' });
      }
    }

    const client = await pool.connect();
    let messageId;
    try {
      await client.query('BEGIN');

      const insertResult = await client.query(`
        INSERT INTO collab_messages (room_id, author_id, content, parent_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [room_id, req.user.id, content, parent_id || null]);

      messageId = insertResult.rows[0].id;

      // Create notifications for all other room members
      const membersResult = await client.query(`
        SELECT user_id FROM collab_room_members WHERE room_id = $1 AND user_id != $2
      `, [room_id, req.user.id]);

      for (const m of membersResult.rows) {
        await client.query(`
          INSERT INTO collab_notifications (user_id, room_id, message_id) VALUES ($1, $2, $3)
        `, [m.user_id, room_id, messageId]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const messageResult = await query(`
      SELECT m.*, u.name as author_name
      FROM collab_messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.id = $1
    `, [messageId]);

    return res.status(201).json(messageResult.rows[0]);
  } catch (error) {
    console.error('Create message error:', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
});

// ============ NOTIFICATIONS ============

// GET /api/collaboration/notifications/unread - Get total unread count
router.get('/notifications/unread', verifyToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT COUNT(*) as total_unread FROM collab_notifications
      WHERE user_id = $1 AND is_read = 0
    `, [req.user.id]);

    return res.json({ total_unread: result.rows[0].total_unread });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// POST /api/collaboration/notifications/mark-read - Mark room notifications as read
router.post('/notifications/mark-read', verifyToken, async (req, res) => {
  try {
    const { room_id } = req.body;

    if (!room_id) {
      return res.status(400).json({ error: 'room_id is required' });
    }

    await query(`
      UPDATE collab_notifications SET is_read = 1
      WHERE user_id = $1 AND room_id = $2 AND is_read = 0
    `, [req.user.id, room_id]);

    return res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

export default router;
