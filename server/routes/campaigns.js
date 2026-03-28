import express from 'express';
import { query } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/campaigns - Get all campaigns
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, assigned_to } = req.query;

    let sql = `
      SELECT c.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u1 ON c.assigned_to = u1.id
      LEFT JOIN users u2 ON c.created_by = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }
    if (assigned_to) {
      sql += ` AND c.assigned_to = $${paramIndex++}`;
      params.push(assigned_to);
    }

    // Teachers only see campaigns assigned to them
    if (req.user.role === 'teacher') {
      sql += ` AND c.assigned_to = $${paramIndex++}`;
      params.push(req.user.id);
    }

    sql += ' ORDER BY c.visit_date ASC, c.created_at DESC';

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get campaigns error:', error);
    return res.status(500).json({ error: 'Failed to get campaigns' });
  }
});

// POST /api/campaigns - Create campaign
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, assigned_to, location, visit_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const insertResult = await query(`
      INSERT INTO campaigns (title, description, assigned_to, location, visit_date, created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      title,
      description || null,
      assigned_to || null,
      location || null,
      visit_date || null,
      req.user.id,
      'planned'
    ]);

    const newId = insertResult.rows[0].id;

    const campaignResult = await query(`
      SELECT c.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u1 ON c.assigned_to = u1.id
      LEFT JOIN users u2 ON c.created_by = u2.id
      WHERE c.id = $1
    `, [newId]);

    return res.status(201).json(campaignResult.rows[0]);
  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// GET /api/campaigns/:id - Get campaign by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT c.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u1 ON c.assigned_to = u1.id
      LEFT JOIN users u2 ON c.created_by = u2.id
      WHERE c.id = $1
    `, [id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get campaign error:', error);
    return res.status(500).json({ error: 'Failed to get campaign' });
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, location, visit_date, notes, status } = req.body;

    const campaignResult = await query('SELECT id FROM campaigns WHERE id = $1', [id]);

    if (!campaignResult.rows[0]) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(assigned_to);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      values.push(location);
    }
    if (visit_date !== undefined) {
      updates.push(`visit_date = $${paramIndex++}`);
      values.push(visit_date);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const updatedResult = await query(`
      SELECT c.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u1 ON c.assigned_to = u1.id
      LEFT JOIN users u2 ON c.created_by = u2.id
      WHERE c.id = $1
    `, [id]);

    return res.json(updatedResult.rows[0]);
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
    await query('UPDATE campaigns SET live_lat = $1, live_lng = $2, live_updated_at = $3 WHERE id = $4',
      [lat, lng, now, id]);

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

      await query('INSERT INTO campaign_location_logs (campaign_id, lat, lng, place_name, logged_at) VALUES ($1, $2, $3, $4, $5)',
        [id, lat, lng, placeName, now]);
    }

    return res.json({ message: 'Location updated' });
  } catch (error) {
    console.error('Update location error:', error);
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

// GET /api/campaigns/:id/location-logs - Get location timeline
router.get('/:id/location-logs', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT * FROM campaign_location_logs WHERE campaign_id = $1 ORDER BY logged_at ASC
    `, [id]);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get location logs error:', error);
    return res.status(500).json({ error: 'Failed to get location logs' });
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const campaignResult = await query('SELECT id FROM campaigns WHERE id = $1', [id]);

    if (!campaignResult.rows[0]) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await query('DELETE FROM campaigns WHERE id = $1', [id]);

    return res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
