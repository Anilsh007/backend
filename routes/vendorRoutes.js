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
      await fsPromises.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const fieldName = file.fieldname;
    const ext = path.extname(file.originalname);
    const filename = `${fieldName}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const multiUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'docx', maxCount: 1 }
]);

const getPath = (file) => file ? file[0].path.replace(path.join(__dirname, '..', 'uploads') + path.sep, '').replace(/\\/g, '/') : null;

// CREATE
router.post('/', multiUpload, async (req, res) => {
  const {
    ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
    Address1, Address2, City, State, ZipCode,
    Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
    Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
    Phone, Mobile, Sbclass, Class, UserId, Password,
    SecQuestion, SecAnswer, Aboutus, Type, DateTime
  } = req.body;

  const uploadDir = path.join(__dirname, '..', 'uploads', ClientId, `Vendor_${vendorcode}`);

  try {
    if (!ClientId || !vendorcode || !Email) {
      // Clean up folder if it was created
      await fsPromises.rm(uploadDir, { recursive: true, force: true });
      return res.status(400).json({ success: false, message: 'ClientId, vendorcode, and Email are required.' });
    }

    const profileImage = getPath(req.files?.['profileImage']);
    const docx = getPath(req.files?.['docx']);

    const [vendorMatch] = await pool.query('SELECT id FROM vendorRegister WHERE Email = ?', [Email]);
    const [adminMatch] = await pool.query('SELECT id FROM clientAdmin WHERE AdminEmail = ?', [Email]);
    const [clientMatch] = await pool.query('SELECT id FROM clientUsers WHERE Email = ?', [Email]);

    if (vendorMatch.length > 0 || adminMatch.length > 0 || clientMatch.length > 0) {
      // Clean up folder if email already exists
      await fsPromises.rm(uploadDir, { recursive: true, force: true });
      return res.status(400).json({ success: false, message: 'Email already exists in the system.' });
    }

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

    await pool.execute(sql, values);
    res.json({ success: true, message: 'Vendor added successfully.' });
  } catch (err) {
    console.error('Create Error:', err);

    // Attempt to clean up folder on error
    try {
      await fsPromises.rm(uploadDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.warn('Cleanup failed:', cleanupErr);
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});


// READ ALL
router.get('/', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query('SELECT * FROM vendorRegister LIMIT ? OFFSET ?', [parseInt(limit), parseInt(offset)]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// READ by vendorcode
router.get('/:vendorcode', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vendorRegister WHERE vendorcode = ?', [req.params.vendorcode]);
    if (rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ by ClientId
router.get('/searchVendor/:ClientId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vendorRegister WHERE ClientId = ?', [req.params.ClientId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE
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

    const profileImage = getPath(req.files?.['profileImage']);
    const docx = getPath(req.files?.['docx']);

    const [vendorMatch] = await pool.query('SELECT id FROM vendorRegister WHERE Email = ?', [Email]);
    const [adminMatch] = await pool.query('SELECT id FROM clientAdmin WHERE AdminEmail = ?', [Email]);
    const [clientMatch] = await pool.query('SELECT id FROM clientUsers WHERE Email = ?', [Email]);

    if (vendorMatch.length > 0 || adminMatch.length > 0 || clientMatch.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists in the system.' });
    }

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

// DELETE vendor by ID and remove their folder
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch ClientId and vendorcode
    const [rows] = await pool.query(
      'SELECT ClientId, vendorcode FROM vendorRegister WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const ClientId = rows[0].ClientId?.trim();
    const vendorcode = rows[0].vendorcode?.trim();

    const vendorFolder = path.join(__dirname, '..', 'uploads', ClientId, `Vendor_${vendorcode}`);
    console.log('🛠️ Attempting to delete folder:', vendorFolder);

    // First delete vendor record from DB
    await pool.query('DELETE FROM vendorRegister WHERE id = ?', [id]);
    console.log('✅ Vendor record deleted from DB');

    // Check if folder exists
    try {
      await fsPromises.access(vendorFolder); // will throw if not exists
      await fsPromises.rm(vendorFolder, { recursive: true, force: true });
      console.log('✅ Folder deleted:', vendorFolder);
    } catch (folderErr) {
      console.warn('⚠️ Folder not found or cannot delete:', vendorFolder);
    }

    res.json({ success: true, message: 'Vendor deleted successfully.' });
  } catch (err) {
    console.error('❌ Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});



// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const Email = email.toLowerCase().trim();

  try {
    const [rows] = await pool.execute('SELECT * FROM vendorRegister WHERE Email = ? AND Password = ? LIMIT 1', [Email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: rows[0],
      token: 'dummy-token'
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
