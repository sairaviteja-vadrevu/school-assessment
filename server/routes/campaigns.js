import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/campaigns - Get all campaigns
router.get('/', verifyToken, (req, res) => {
  try {
    const { status, assigned_to } = req.query;

    let query = `
      SELECT c.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u1 ON c.assigned_to = u1.id
      LEFT JOIN users u2 ON c.created_by = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (assigned_to) {
      query += ' AND c.assigned_to = ?';
      params.push(assigned_to);
    }

    // Teachers only see campaigns assigned to them
    if (req.user.role === 'teacher') {
      query += ' AND c.assigned_to = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY c.visit_date ASC, c.created_at DESC';

    const campaigns = db.prepare(query).all(...params);
    return res.json(campaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    return res.status(500).json({ error: 'Failed to get campaigns' });
  }
});

// POST /api/campaigns - Create campaign
router.post('/', verifyToken, (req, res) => {
  try {
    const { title, description, assigned_to, location, visit_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = db.prepare(`
      INSERT INTO campaigns (title, description, assigned_to, location, visit_date, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      assigned_to || null,
      location || null,
      visit_date || null,
      req.user.id,
      'planned'
    );

    const campaign = db.prepare(`
      SELECT c.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u1 ON c.assigned_to = u1.id
      LEFT JOIN users u2 ON c.created_by = u2.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// GET /api/campaigns/:id - Get campaign by ID
router.get('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const campaign = db.prepare(`
      SELECT c.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u1 ON c.assigned_to = u1.id
      LEFT JOIN users u2 ON c.created_by = u2.id
      WHERE c.id = ?
    `).get(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    return res.status(500).json({ error: 'Failed to get campaign' });
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, location, visit_date, notes, status } = req.body;

    const campaign = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
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
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (visit_date !== undefined) {
      updates.push('visit_date = ?');
      values.push(visit_date);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    db.prepare(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedCampaign = db.prepare(`
      SELECT c.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u1 ON c.assigned_to = u1.id
      LEFT JOIN users u2 ON c.created_by = u2.id
      WHERE c.id = ?
    `).get(id);

    return res.json(updatedCampaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    return res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// POST /api/campaigns/:id/location - Update live GPS location + log to timeline
router.post('/:id/location', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, log } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const now = new Date().toISOString();

    // Update current live location
    db.prepare('UPDATE campaigns SET live_lat = ?, live_lng = ?, live_updated_at = ? WHERE id = ?')
      .run(lat, lng, now, id);

    // If log=true, save to location timeline with reverse geocoded place name
    if (log) {
      let placeName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'SchoolApp/1.0' },
        });
        if (response.ok) {
          const data = await response.json();
          const addr = data.address || {};
          placeName = [addr.road, addr.neighbourhood, addr.suburb, addr.city || addr.town || addr.village]
            .filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || placeName;
        }
      } catch (e) {
        // Use coordinate fallback
      }

      db.prepare('INSERT INTO campaign_location_logs (campaign_id, lat, lng, place_name, logged_at) VALUES (?, ?, ?, ?, ?)')
        .run(id, lat, lng, placeName, now);
    }

    return res.json({ message: 'Location updated' });
  } catch (error) {
    console.error('Update location error:', error);
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

// GET /api/campaigns/:id/location-logs - Get location timeline
router.get('/:id/location-logs', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const logs = db.prepare(`
      SELECT * FROM campaign_location_logs WHERE campaign_id = ? ORDER BY logged_at ASC
    `).all(id);
    return res.json(logs);
  } catch (error) {
    console.error('Get location logs error:', error);
    return res.status(500).json({ error: 'Failed to get location logs' });
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const campaign = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);

    return res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
