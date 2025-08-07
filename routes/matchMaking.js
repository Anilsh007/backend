const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db'); // ✅ Corrected way to import pool

// CREATE a new matchmaking event
router.post('/', async (req, res) => {
    try {
        console.log('Incoming Data:', req.body);
        const { ClientId, Title, Date, StartTime, EndTime, Location, TimeDuration, ClientsName } = req.body;

        const sql = 'INSERT INTO matchMaking (ClientId, Title, Date, StartTime, EndTime, Location, TimeDuration, ClientsName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await pool.query(sql, [ClientId, Title, Date, StartTime, EndTime, Location, TimeDuration, ClientsName]);
        res.status(201).json({ message: 'Matchmaking event created successfully' });
    } catch (err) {
        console.error('Insert Error:', err);
        res.status(500).json({ error: 'Failed to create matchmaking event' });
    }
});

// READ all matchmaking events
router.get('/', async (req, res) => {
    try {
        const [events] = await pool.query('SELECT * FROM matchMaking');
        res.json(events);
        console.log('Fetched Matchmaking Events:', events);
    } catch (err) {
        console.error('Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch matchmaking events' });
    }
});

// READ single matchmaking event by id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM matchMaking WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch matchmaking event' });
    }
});

// PUT
router.put('/:id', async (req, res) => {
    const { Title, Date, StartTime, EndTime, Location, TimeDuration, ClientsName } = req.body;
    await pool.query(
        'UPDATE matchMaking SET Title=?, Date=?, StartTime=?, EndTime=?, Location=?, TimeDuration=?, ClientsName=? WHERE id=?',
        [Title, Date, StartTime, EndTime, Location, TimeDuration, ClientsName, req.params.id]
    );
    res.json({ message: 'Matchmaking event updated successfully' });
});

// DELETE
router.delete('/:id', async (req, res) => {
    await pool.query('DELETE FROM matchMaking WHERE id = ?', [req.params.id]);
    res.json({ message: 'Matchmaking event deleted successfully' });
});

router.get('/by-client/:clientId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM matchMaking WHERE ClientId = ?', [req.params.clientId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch client-specific events' });
    }
});


module.exports = router;