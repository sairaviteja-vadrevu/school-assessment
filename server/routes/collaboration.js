import express from 'express';
import db from '../db.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ============ ROOMS ============

// GET /api/collaboration/rooms - Get rooms (filtered by membership for teachers)
router.get('/rooms', verifyToken, (req, res) => {
  try {
    let rooms;

    if (req.user.role === 'admin') {
      rooms = db.prepare(`
        SELECT r.*, u.name as created_by_name,
          (SELECT COUNT(*) FROM collab_messages WHERE room_id = r.id) as message_count,
          (SELECT COUNT(*) FROM collab_notifications WHERE room_id = r.id AND user_id = ? AND is_read = 0) as unread_count
        FROM collab_rooms r
        LEFT JOIN users u ON r.created_by = u.id
        ORDER BY r.created_at DESC
      `).all(req.user.id);
    } else {
      rooms = db.prepare(`
        SELECT r.*, u.name as created_by_name,
          (SELECT COUNT(*) FROM collab_messages WHERE room_id = r.id) as message_count,
          (SELECT COUNT(*) FROM collab_notifications WHERE room_id = r.id AND user_id = ? AND is_read = 0) as unread_count
        FROM collab_rooms r
        LEFT JOIN users u ON r.created_by = u.id
        INNER JOIN collab_room_members m ON m.room_id = r.id AND m.user_id = ?
        ORDER BY r.created_at DESC
      `).all(req.user.id, req.user.id);
    }

    return res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    return res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// POST /api/collaboration/rooms - Create room (admin only) with members
router.post('/rooms', verifyToken, adminOnly, (req, res) => {
  try {
    const { name, description, type, member_ids } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const validTypes = ['department', 'academic', 'event', 'general'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const createRoom = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO collab_rooms (name, description, type, created_by)
        VALUES (?, ?, ?, ?)
      `).run(name, description || null, type, req.user.id);

      const roomId = result.lastInsertRowid;

      // Always add creator as member
      db.prepare('INSERT INTO collab_room_members (room_id, user_id) VALUES (?, ?)').run(roomId, req.user.id);

      // Add invited members
      if (Array.isArray(member_ids)) {
        const insertMember = db.prepare('INSERT OR IGNORE INTO collab_room_members (room_id, user_id) VALUES (?, ?)');
        for (const userId of member_ids) {
          insertMember.run(roomId, userId);
        }
      }

      return roomId;
    });

    const roomId = createRoom();

    const room = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM collab_rooms r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `).get(roomId);

    return res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/collaboration/rooms/:room_id/members - Get room members
router.get('/rooms/:room_id/members', verifyToken, (req, res) => {
  try {
    const { room_id } = req.params;
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.subject, m.joined_at
      FROM collab_room_members m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY u.name ASC
    `).all(room_id);

    return res.json(members);
  } catch (error) {
    console.error('Get room members error:', error);
    return res.status(500).json({ error: 'Failed to get room members' });
  }
});

// POST /api/collaboration/rooms/:room_id/members - Add members (admin only)
router.post('/rooms/:room_id/members', verifyToken, adminOnly, (req, res) => {
  try {
    const { room_id } = req.params;
    const { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }

    const insertMember = db.prepare('INSERT OR IGNORE INTO collab_room_members (room_id, user_id) VALUES (?, ?)');
    for (const userId of user_ids) {
      insertMember.run(room_id, userId);
    }

    return res.json({ message: 'Members added successfully' });
  } catch (error) {
    console.error('Add members error:', error);
    return res.status(500).json({ error: 'Failed to add members' });
  }
});

// ============ MESSAGES ============

// GET /api/collaboration/messages/:room_id - Get messages
router.get('/messages/:room_id', verifyToken, (req, res) => {
  try {
    const { room_id } = req.params;

    // Verify room exists
    const room = db.prepare('SELECT id FROM collab_rooms WHERE id = ?').get(room_id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check membership (admins bypass)
    if (req.user.role !== 'admin') {
      const member = db.prepare('SELECT id FROM collab_room_members WHERE room_id = ? AND user_id = ?').get(room_id, req.user.id);
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this room' });
      }
    }

    const messages = db.prepare(`
      SELECT m.*, u.name as author_name
      FROM collab_messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at ASC
    `).all(room_id);

    return res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Failed to get messages' });
  }
});

// POST /api/collaboration/messages - Send message + create notifications
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

    // Check membership (admins bypass)
    if (req.user.role !== 'admin') {
      const member = db.prepare('SELECT id FROM collab_room_members WHERE room_id = ? AND user_id = ?').get(room_id, req.user.id);
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this room' });
      }
    }

    const sendMessage = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO collab_messages (room_id, author_id, content, parent_id)
        VALUES (?, ?, ?, ?)
      `).run(room_id, req.user.id, content, parent_id || null);

      const messageId = result.lastInsertRowid;

      // Create notifications for all other room members
      const members = db.prepare(`
        SELECT user_id FROM collab_room_members WHERE room_id = ? AND user_id != ?
      `).all(room_id, req.user.id);

      const insertNotification = db.prepare(`
        INSERT INTO collab_notifications (user_id, room_id, message_id) VALUES (?, ?, ?)
      `);
      for (const m of members) {
        insertNotification.run(m.user_id, room_id, messageId);
      }

      // Also notify admin if admin is not a member but should see everything
      // (admins are auto-notified only if they're members)

      return messageId;
    });

    const messageId = sendMessage();

    const message = db.prepare(`
      SELECT m.*, u.name as author_name
      FROM collab_messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.id = ?
    `).get(messageId);

    return res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
});

// ============ NOTIFICATIONS ============

// GET /api/collaboration/notifications/unread - Get total unread count
router.get('/notifications/unread', verifyToken, (req, res) => {
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as total_unread FROM collab_notifications
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.id);

    return res.json({ total_unread: result.total_unread });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// POST /api/collaboration/notifications/mark-read - Mark room notifications as read
router.post('/notifications/mark-read', verifyToken, (req, res) => {
  try {
    const { room_id } = req.body;

    if (!room_id) {
      return res.status(400).json({ error: 'room_id is required' });
    }

    db.prepare(`
      UPDATE collab_notifications SET is_read = 1
      WHERE user_id = ? AND room_id = ? AND is_read = 0
    `).run(req.user.id, room_id);

    return res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

export default router;
