const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Serve uploaded files statically
router.use('/uploads', express.static(uploadDir));

/** ---------------------------
 * @route   POST /api/admin
 * @desc    Create new admin
 * --------------------------- */
router.post('/', upload.single('Logo'), async (req, res) => {
  const {
    CompanyName, FirstName, LastName, AdminEmail,
    Address1, Address2, City, State, ZipCode, Phone,
    Mobile, Password, Question, Answer, AboutUs,
    LiceseQty, Type
  } = req.body;

  const logoFilename = req.file ? req.file.filename : '';

  try {
    // Check if email already exists
    const [existing] = await pool.execute('SELECT id FROM clientAdmin WHERE AdminEmail = ?', [AdminEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    await pool.execute(
      `INSERT INTO clientAdmin (
        CompanyName, FirstName, LastName, AdminEmail, Address1, Address2, City,
        State, ZipCode, Phone, Mobile, Password, Question, Answer,
        AboutUs, Logo, LiceseQty, Type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        CompanyName, FirstName, LastName, AdminEmail, Address1, Address2, City,
        State, ZipCode, Phone, Mobile, Password, Question, Answer,
        AboutUs, logoFilename, LiceseQty, Type
      ]
    );
    res.status(201).json({ message: 'Admin created successfully.' });
  } catch (err) {
    console.error('❌ Create error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/** ---------------------------
 * @route   GET /api/admin
 * @desc    Get all admins
 * --------------------------- */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clientAdmin');
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Read all error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/** ---------------------------
 * @route   GET /api/admin/:id
 * @desc    Get single admin
 * --------------------------- */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM clientAdmin WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Admin not found.' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('❌ Read one error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/** ---------------------------
 * @route   PUT /api/admin/:id
 * @desc    Update an admin
 * --------------------------- */
router.put('/:id', upload.single('Logo'), async (req, res) => {
  const { id } = req.params;
  const {
    CompanyName, FirstName, LastName, AdminEmail,
    Address1, Address2, City, State, ZipCode, Phone,
    Mobile, Password, Question, Answer, AboutUs,
    LiceseQty, Type
  } = req.body;

  const logoFilename = req.file ? req.file.filename : req.body.Logo;

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM clientAdmin WHERE AdminEmail = ? AND id != ?',
      [AdminEmail, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already in use by another admin.' });
    }

    const [result] = await pool.execute(
      `UPDATE clientAdmin SET
        CompanyName = ?, FirstName = ?, LastName = ?, AdminEmail = ?, Address1 = ?, Address2 = ?,
        City = ?, State = ?, ZipCode = ?, Phone = ?, Mobile = ?, Password = ?, Question = ?, Answer = ?,
        AboutUs = ?, Logo = ?, LiceseQty = ?, Type = ?
        WHERE id = ?`,
      [
        CompanyName, FirstName, LastName, AdminEmail, Address1, Address2, City,
        State, ZipCode, Phone, Mobile, Password, Question, Answer,
        AboutUs, logoFilename, LiceseQty, Type, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    res.status(200).json({ message: 'Admin updated successfully.' });
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/** ---------------------------
 * @route   DELETE /api/admin/:id
 * @desc    Delete an admin
 * --------------------------- */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute('DELETE FROM clientAdmin WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    res.status(200).json({ message: 'Admin deleted successfully.' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;