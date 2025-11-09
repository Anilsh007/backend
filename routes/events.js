// routes/events.js
const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db'); // ✅ Correct destructuring
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// ==================== Multer Storage ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { ClientId, date, time } = req.body;
    if (!ClientId || !date || !time) {
      return cb(new Error('Missing ClientId, date, or time field'));
    }

    const folderName = `${date}_${time.replace(/:/g, '-')}`;
    const uploadPath = path.join(__dirname, `../uploads/${ClientId}/events/${folderName}`);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
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

    const logos = req.files ? req.files.map((f) => f.filename) : [];

    const [result] = await pool.query(
      `INSERT INTO events_created 
      (ClientId, title, date, time, Address1, Address2, city, state, zip, description, logos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ClientId, title, date, time, Address1, Address2, city, state, zip, description, JSON.stringify(logos)]
    );

    res.status(201).json({ message: 'Event created successfully', id: result.insertId });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== GET EVENTS BY CLIENT ====================
router.get('/:ClientId', async (req, res) => {
  try {
    const { ClientId } = req.params;
    const [rows] = await pool.query('SELECT * FROM events_created WHERE ClientId = ?', [ClientId]);
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

    const logos = req.files ? req.files.map((f) => f.filename) : [];

    const [result] = await pool.query(
      `UPDATE events_created SET 
        ClientId=?, title=?, date=?, time=?, Address1=?, Address2=?, 
        city=?, state=?, zip=?, description=?, logos=? 
      WHERE id=?`,
      [ClientId, title, date, time, Address1, Address2, city, state, zip, description, JSON.stringify(logos), id]
    );

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== DELETE EVENT ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM events_created WHERE id = ?', [id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;