const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const clientId = req.body.ClientId;
    const vendorcode = req.body.vendorcode;

    if (!clientId || !vendorcode) return cb(new Error('ClientId and vendorcode are required'));

    const dir = path.join(__dirname, '..', 'uploads', clientId, `Vendor_${vendorcode}`);

    try {
      await fsPromises.mkdir(dir, { recursive: true }); // ensures nested folder exists
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const fieldName = file.fieldname; // e.g., 'profileImage'
    const ext = path.extname(file.originalname);
    const filename = `${fieldName}${ext}`;
    cb(null, filename);
  }
});


const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max file size
  }
});


const multiUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'docx', maxCount: 1 }
]);

// ✅ Safe relative upload path

const getPath = (file) => file ? file[0].path.replace(path.join(__dirname, '..', 'uploads') + path.sep, '').replace(/\\/g, '/') : null;


// ========================== CREATE ===============================
router.post('/', multiUpload, async (req, res) => {
  try {
    const {
      ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
      Address1, Address2, City, State, ZipCode,
      Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
      Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
      Phone, Mobile, Sbclass, Class, UserId, Password,
      SecQuestion, SecAnswer, Aboutus, Type, DateTime
    } = req.body;

    // Safely get file paths
    const profileImage = getPath(req.files?.['profileImage']);
    const docx = getPath(req.files?.['docx']);

    // Validate required fields
    if (!ClientId || !vendorcode || !Email) {
      return res.status(400).json({ success: false, message: 'ClientId, vendorcode, and Email are required.' });
    }

    // Check for duplicate email
    const [existing] = await pool.execute(
      'SELECT id FROM vendorRegister WHERE Email = ?',
      [Email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // SQL and values
    const sql = `
      INSERT INTO vendorRegister (
        ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
        Address1, Address2, City, State, ZipCode,
        Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
        Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
        Phone, Mobile, Sbclass, Class, UserId, Password,
        SecQuestion, SecAnswer, Aboutus, Type, profileImage, docx, DateTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
      Address1, Address2, City, State, ZipCode,
      Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
      Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
      Phone, Mobile, Sbclass, Class, UserId, Password,
      SecQuestion, SecAnswer, Aboutus, Type, profileImage, docx, DateTime
    ];

    if (values.length !== 37) {
      console.error('❌ Incorrect number of values in INSERT:', values.length);
      return res.status(500).json({ error: 'Server config error: expected 37 fields.' });
    }

    // Execute insert
    await pool.execute(sql, values);

    res.json({ success: true, message: 'Vendor added successfully.' });

  } catch (err) {
    console.error('❌ Create Error:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ========================== READ ALL ===============================
// Replace the current GET /
router.get('/', async (req, res) => {
  const { page = 1, limit = 50 } = req.query; // Defaults to page 1, 50 records
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM vendorRegister LIMIT ? OFFSET ?',
      [parseInt(limit), parseInt(offset)]
    );
    res.json(rows);
  } catch (err) {
    console.error('Read All Error:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Failed to fetch vendors', details: err.message });
  }
});


// ========================== READ by VENDORCODE ===============================
router.get('/:vendorcode', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vendorRegister WHERE vendorcode = ?', [req.params.vendorcode]);
    if (rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch by vendorcode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ========================== READ by VENDORCODE ===============================
router.get('/:ClientId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vendorRegister WHERE ClientId = ?', [req.params.ClientId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch by ClientId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================== UPDATE ===============================
router.put('/:id', multiUpload, async (req, res) => {
  try {
    const id = req.params.id;
    const {
      ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
      Address1, Address2, City, State, ZipCode,
      Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
      Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
      Phone, Mobile, Sbclass, Class, UserId, Password,
      SecQuestion, SecAnswer, Aboutus, Type, DateTime
    } = req.body;

    const profileImage = getPath(req.files['profileImage']);
    const docx = getPath(req.files['docx']);

    const updates = [
      'ClientId = ?', 'vendorcode = ?', 'vendorcompanyname = ?', 'Fname = ?', 'Lname = ?', 'Email = ?',
      'Address1 = ?', 'Address2 = ?', 'City = ?', 'State = ?', 'ZipCode = ?',
      'Samuin = ?', 'Fein = ?', 'Duns = ?', 'Naics1 = ?', 'Naics2 = ?', 'Naics3 = ?', 'Naics4 = ?', 'Naics5 = ?',
      'Nigp1 = ?', 'Nigp2 = ?', 'Nigp3 = ?', 'Nigp4 = ?', 'Nigp5 = ?',
      'Phone = ?', 'Mobile = ?', 'Sbclass = ?', 'Class = ?', 'UserId = ?', 'Password = ?',
      'SecQuestion = ?', 'SecAnswer = ?', 'Aboutus = ?', 'Type = ?', 'DateTime = ?'
    ];
    const values = [
      ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
      Address1, Address2, City, State, ZipCode,
      Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
      Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
      Phone, Mobile, Sbclass, Class, UserId, Password,
      SecQuestion, SecAnswer, Aboutus, Type, DateTime
    ];

    if (profileImage) {
      updates.push('profileImage = ?');
      values.push(profileImage);
    }
    if (docx) {
      updates.push('docx = ?');
      values.push(docx);
    }

    values.push(id);
    const sql = `UPDATE vendorRegister SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(sql, values);

    res.json({ success: true, message: 'Vendor updated successfully.' });
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// ========================== DELETE ===============================
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vendorRegister WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Vendor deleted successfully.' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// ========================== LOGIN ===============================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM vendorRegister WHERE Email = ? AND Password = ? LIMIT 1',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: rows[0],
      token: 'dummy-token' // Replace with JWT in production
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
