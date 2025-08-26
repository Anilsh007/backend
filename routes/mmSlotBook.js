// routes/mmSlotBook.js
const express = require("express");
const router = express.Router();
const { pool } = require('../utils/db'); // ✅ MySQL connection pool import

// ✅ Get all bookings for a specific MatchMakingId
router.get("/:matchMakingId", async (req, res) => {
    const matchMakingId = req.params.matchMakingId;
    try {
        const [results] = await pool.query(
            "SELECT * FROM matchMakingSlot_bookings WHERE MatchMakingId = ? ORDER BY SlotStart",
            [matchMakingId]
        );
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Book a slot
router.post("/", async (req, res) => {
    const { MatchMakingId, ClientName, SlotStart, SlotEnd, BookedByVendor, ClientId, userName, eventDate } = req.body;

    try {
        // Check if already booked
        const [rows] = await pool.query(
            "SELECT * FROM matchMakingSlot_bookings WHERE MatchMakingId=? AND ClientName=? AND SlotStart=?",
            [MatchMakingId, ClientName, SlotStart]
        );

        if (rows.length > 0) {
            return res.status(400).json({ message: "Slot already booked!" });
        }

        // Book slot
        const [result] = await pool.query(
            "INSERT INTO matchMakingSlot_bookings (MatchMakingId, ClientName, SlotStart, SlotEnd, BookedByVendor, ClientId, userName, eventDate) VALUES (?,?,?,?,?,?,?,?)",
            [MatchMakingId, ClientName, SlotStart, SlotEnd, BookedByVendor, ClientId, userName, eventDate]
        );

        res.json({ message: "Slot booked successfully", BookingId: result.insertId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Get booked slots for a given MatchMakingId (include who booked it)
router.get('/status/:matchMakingId', async (req, res) => {
    const { matchMakingId } = req.params;
    try {
        const [rows] = await pool.query(`SELECT  ClientName, SlotStart, SlotEnd, eventDate, BookedByVendor, ClientId, userName FROM matchMakingSlot_bookings WHERE MatchMakingId = ? ORDER BY SlotStart`, [matchMakingId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching booked slots' });
    }
});


module.exports = router;
