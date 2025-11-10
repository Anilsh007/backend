const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const multer = require('multer');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// ==================== Multer Storage ====================
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { ClientId, date, time } = req.body;
      if (!ClientId) return cb(new Error('ClientId is required'));

      // Make safe folder names
      const safeDate = (date || new Date().toISOString()).replace(/[:T.Z]/g, '-');
      const safeTime = (time || '00-00').replace(/[:]/g, '-');
      const folderName = `${safeDate}_${safeTime}`;

      // Example: /var/www/backend/uploads/aaa/events/2025-11-14_10-13
      const dir = path.join(__dirname, '..', 'uploads', ClientId, 'events', folderName);

      // Ensure folder exists
      await fsPromises.mkdir(dir, { recursive: true });

      // Store relative path for DB use
      req.eventFolderPath = `/uploads/${ClientId}/events/${folderName}`;

      console.log('📁 Created or found folder:', dir);
      cb(null, dir);
    } catch (err) {
      console.error('❌ Folder creation error:', err);
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ==================== CREATE EVENT ====================
router.post('/', upload.array('logos', 10), async (req, res) => {
  try {
    const {
      ClientId,
      title,
      date,
      time,
      Address1,
      Address2,
      city,
      state,
      zip,
      description,
    } = req.body;

    if (!ClientId || !title || !date) {
      return res
        .status(400)
        .json({ error: 'Missing required fields (ClientId, title, date)' });
    }

    const logos = req.files
      ? req.files.map((f) => `${req.eventFolderPath}/${f.filename}`)
      : [];

    const [result] = await pool.query(
      `INSERT INTO events_created 
      (ClientId, title, date, time, Address1, Address2, city, state, zip, description, logos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ClientId,
        title,
        date,
        time,
        Address1,
        Address2,
        city,
        state,
        zip,
        description,
        JSON.stringify(logos),
      ]
    );

    res.status(201).json({
      message: '✅ Event created successfully',
      id: result.insertId,
      title,
      date,
    });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== GET EVENTS BY CLIENT ====================
router.get('/:ClientId', async (req, res) => {
  try {
    const { ClientId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM events_created WHERE ClientId = ? ORDER BY date DESC',
      [ClientId]
    );
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== UPDATE EVENT ====================
router.put('/:id', upload.array('logos', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ClientId,
      title,
      date,
      time,
      Address1,
      Address2,
      city,
      state,
      zip,
      description,
    } = req.body;

    if (!ClientId) return res.status(400).json({ error: 'Missing ClientId field' });

    const logos = req.files
      ? req.files.map((f) => `${req.eventFolderPath}/${f.filename}`)
      : [];

    const [result] = await pool.query(
      `UPDATE events_created SET 
        ClientId=?, title=?, date=?, time=?, Address1=?, Address2=?, 
        city=?, state=?, zip=?, description=?, logos=? 
      WHERE id=?`,
      [
        ClientId,
        title,
        date,
        time,
        Address1,
        Address2,
        city,
        state,
        zip,
        description,
        JSON.stringify(logos),
        id,
      ]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Event not found' });

    res.json({ message: '✅ Event updated successfully' });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== DELETE EVENT ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM events_created WHERE id = ?', [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Event not found' });

    res.json({ message: '✅ Event deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
