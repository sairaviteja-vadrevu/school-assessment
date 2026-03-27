import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ROOMS ENDPOINTS

// GET /api/collaboration/rooms - Get all rooms
router.get('/rooms', verifyToken, (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT r.*, u.name as created_by_name,
             (SELECT COUNT(*) FROM collab_messages WHERE room_id = r.id) as message_count
      FROM collab_rooms r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.created_at DESC
    `).all();

    return res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    return res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// POST /api/collaboration/rooms - Create room
router.post('/rooms', verifyToken, (req, res) => {
  try {
    const { name, description, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const validTypes = ['department', 'academic', 'event', 'general'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const result = db.prepare(`
      INSERT INTO collab_rooms (name, description, type, created_by)
      VALUES (?, ?, ?, ?)
    `).run(name, description || null, type, req.user.id);

    const room = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM collab_rooms r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

// MESSAGES ENDPOINTS

// GET /api/collaboration/messages/:room_id - Get messages by room
router.get('/messages/:room_id', verifyToken, (req, res) => {
  try {
    const { room_id } = req.params;
    const { parent_id } = req.query;

    // Verify room exists
    const room = db.prepare('SELECT id FROM collab_rooms WHERE id = ?').get(room_id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    let query = `
      SELECT m.*, u.name as author_name
      FROM collab_messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.room_id = ?
    `;
    const params = [room_id];

    if (parent_id) {
      query += ' AND m.parent_id = ?';
      params.push(parent_id);
    } else {
      query += ' AND m.parent_id IS NULL';
    }

    query += ' ORDER BY m.created_at ASC';

    const messages = db.prepare(query).all(...params);

    // Get replies for each message
    const messagesWithReplies = messages.map(msg => {
      const replies = db.prepare(`
        SELECT m.*, u.name as author_name
        FROM collab_messages m
        LEFT JOIN users u ON m.author_id = u.id
        WHERE m.parent_id = ?
        ORDER BY m.created_at ASC
      `).all(msg.id);

      return { ...msg, replies };
    });

    return res.json(messagesWithReplies);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Failed to get messages' });
  }
});

// POST /api/collaboration/messages - Create message
router.post('/messages', verifyToken, (req, res) => {
  try {
    const { room_id, content, parent_id } = req.body;

    if (!room_id || !content) {
      return res.status(400).json({ error: 'Room ID and content are required' });
    }

    // Verify room exists
    const room = db.prepare('SELECT id FROM collab_rooms WHERE id = ?').get(room_id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // If parent_id provided, verify it exists
    if (parent_id) {
      const parent = db.prepare('SELECT id FROM collab_messages WHERE id = ?').get(parent_id);
      if (!parent) {
        return res.status(404).json({ error: 'Parent message not found' });
      }
    }

    const result = db.prepare(`
      INSERT INTO collab_messages (room_id, author_id, content, parent_id)
      VALUES (?, ?, ?, ?)
    `).run(room_id, req.user.id, content, parent_id || null);

    const message = db.prepare(`
      SELECT m.*, u.name as author_name
      FROM collab_messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
});

export default router;
