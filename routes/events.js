const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../utils/db");

const router = express.Router();

const BASE_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { ClientId, date, time } = req.body;

    if (!ClientId || !date || !time) {
      return cb(new Error("ClientId, date, and time are required"), false);
    }

    // Example: uploads/123/2025-11-07_10-30/
    const eventFolder = `${date}_${time.replace(/:/g, "-")}`;
    const uploadPath = path.join(BASE_DIR, `${ClientId}`, eventFolder);

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ CREATE event
router.post("/", upload.array("logos", 5), async (req, res) => {
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

    const logoPaths = req.files.map((f) => f.path.replace(/\\/g, "/"));

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
        JSON.stringify(logoPaths),
      ]
    );

    res.status(201).json({
      message: "Event created successfully",
      eventId: result.insertId,
      logos: logoPaths,
    });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET all events
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM events_created ORDER BY date DESC, time DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET events by ClientId
router.get("/client/:ClientId", async (req, res) => {
  try {
    const { ClientId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM events_created WHERE ClientId = ? ORDER BY date DESC, time DESC",
      [ClientId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ UPDATE event
router.put("/:id", upload.array("logos", 5), async (req, res) => {
  try {
    const { id } = req.params;
    const {
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

    const newLogos = req.files.map((f) => f.path.replace(/\\/g, "/"));

    const [existing] = await pool.query(
      "SELECT logos FROM events_created WHERE id = ?",
      [id]
    );

    let allLogos = [];
    if (existing.length && existing[0].logos) {
      allLogos = JSON.parse(existing[0].logos);
    }
    allLogos.push(...newLogos);

    await pool.query(
      `UPDATE events_created 
       SET title=?, date=?, time=?, Address1=?, Address2=?, city=?, state=?, zip=?, description=?, logos=?, updated_at=NOW()
       WHERE id=?`,
      [
        title,
        date,
        time,
        Address1,
        Address2,
        city,
        state,
        zip,
        description,
        JSON.stringify(allLogos),
        id,
      ]
    );

    res.json({ message: "Event updated successfully", logos: allLogos });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ DELETE event
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      "SELECT logos FROM events_created WHERE id = ?",
      [id]
    );

    if (existing.length && existing[0].logos) {
      const logos = JSON.parse(existing[0].logos);
      logos.forEach((file) => {
        try {
          fs.unlinkSync(file);
        } catch {
          console.warn("File not found or already deleted:", file);
        }
      });
    }

    await pool.query("DELETE FROM events_created WHERE id = ?", [id]);
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;