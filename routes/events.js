// backend/routes/events.js
const express = require("express");
const router = express.Router();
const { pool } = require("../utils/db");
const multer = require("multer");
const fsPromises = require("fs").promises;
const path = require("path");

// ==================== Multer Storage ====================
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { ClientId, date, StartTime } = req.body;
      if (!ClientId) return cb(new Error("ClientId is required"));

      const safeDate = (date || new Date().toISOString()).replace(/[:T.Z]/g, "-");
      const safeStart = (StartTime || "00:00").replace(/[:]/g, "-");

      const folderName = `${safeDate}_${safeStart}`;

      const dir = path.join(
        __dirname,
        "..",
        "uploads",
        ClientId,
        "events",
        folderName
      );

      await fsPromises.mkdir(dir, { recursive: true });

      req.eventFolderPath = `/uploads/${ClientId}/events/${folderName}`;

      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    const safeFileName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    const ext = path.extname(safeFileName);
    const baseName = path.basename(safeFileName, ext);

    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const upload = multer({ storage });

// ==================== CREATE EVENT ====================
router.post("/", upload.array("logos", 10), async (req, res) => {
  try {
    const {
      ClientId,
      title,
      date,
      StartTime,
      EndTime,
      TimeDuration,
      Address1,
      Address2,
      city,
      state,
      zip,
      description,
      priceBucket,
    } = req.body;

    if (!ClientId || !title || !date) {
      return res
        .status(400)
        .json({ error: "Missing required fields (ClientId, title, date)" });
    }

    // Parse priceBucket JSON
    const parsedPriceBucket = priceBucket ? JSON.parse(priceBucket) : [];

    const logos = req.files
      ? req.files.map((f) => `${req.eventFolderPath}/${f.filename}`)
      : [];

    const [result] = await pool.query(
      `INSERT INTO events_created 
      (ClientId, title, date, StartTime, EndTime, TimeDuration,
       Address1, Address2, city, state, zip, description, logos, priceBucket)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ClientId,
        title,
        date,
        StartTime,
        EndTime,
        TimeDuration,
        Address1,
        Address2,
        city,
        state,
        zip,
        description,
        JSON.stringify(logos),
        JSON.stringify(parsedPriceBucket),
      ]
    );

    res.status(201).json({
      message: "✅ Event created successfully",
      id: result.insertId,
      title,
      date,
      StartTime,
      EndTime,
      TimeDuration,
      logos,
      priceBucket: parsedPriceBucket,
    });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== GET EVENTS BY CLIENT ====================
router.get("/:ClientId", async (req, res) => {
  try {
    const { ClientId } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM events_created WHERE ClientId = ? ORDER BY date DESC",
      [ClientId]
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== UPDATE EVENT ====================
router.put("/:id", upload.array("logos", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ClientId,
      title,
      date,
      StartTime,
      EndTime,
      TimeDuration,
      Address1,
      Address2,
      city,
      state,
      zip,
      description,
      priceBucket,
    } = req.body;

    if (!ClientId)
      return res.status(400).json({ error: "Missing ClientId field" });

    const parsedPriceBucket = priceBucket ? JSON.parse(priceBucket) : [];

    const logos = req.files
      ? req.files.map((f) => `${req.eventFolderPath}/${f.filename}`)
      : [];

    const [result] = await pool.query(
      `UPDATE events_created SET 
        ClientId=?, title=?, date=?, StartTime=?, EndTime=?, TimeDuration=?, 
        Address1=?, Address2=?, city=?, state=?, zip=?, description=?, logos=?, 
        priceBucket=?
      WHERE id=?`,
      [
        ClientId,
        title,
        date,
        StartTime,
        EndTime,
        TimeDuration,
        Address1,
        Address2,
        city,
        state,
        zip,
        description,
        JSON.stringify(logos),
        JSON.stringify(parsedPriceBucket),
        id,
      ]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Event not found" });

    res.json({ message: "✅ Event updated successfully" });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== DELETE EVENT ====================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM events_created WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Event not found" });

    res.json({ message: "✅ Event deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;