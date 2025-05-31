const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const multer = require('multer');
const path = require('path');
const fsPromises = require('fs').promises; // Add this at the top
const fs = require('fs');

// Setup multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let clientId = req.body?.ClientId;
    if (!clientId) {
      return cb(new Error('ClientId is required for directory naming'));
    }

    const dir = path.join(__dirname, '..', 'uploads', clientId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: function (req, file, cb) {
    const fieldName = file.fieldname; // e.g., 'profileImage'
    const timestamp = Date.now();
    const ext = path.extname(file.originalname); // e.g., '.jpg'
    const filename = `${fieldName}-${timestamp}${ext}`;
    cb(null, filename);
  }
});


const upload = multer({ storage });

const multiUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'companylogo', maxCount: 1 },
  { name: 'baner', maxCount: 1 }
]);

/**
 * POST /api/admin
 * Create a new admin with image
 */
router.post('/', multiUpload, async (req, res) => {
  const {
    ClientId, CompanyName, FirstName, LastName, AdminEmail, Address1, Address2,
    City, State, ZipCode, Phone, Mobile, Password, Question, Answer,
    AboutUs, LicenseQty, Type
  } = req.body;

  const getPath = (file) => file ? file[0].path.replace(/\\/g, '/').split('uploads')[1] : null;

  const profileImage = getPath(req.files['profileImage']);
  const companylogo = getPath(req.files['companylogo']);
  const baner = getPath(req.files['baner']);

  const fullImagePath = req.file ? req.file.path : null;

  try {
    const [existingMail] = await pool.execute('SELECT id FROM clientAdmin WHERE AdminEmail = ?', [AdminEmail]);
    if (existingMail.length > 0) {
      if (fullImagePath) await fsPromises.unlink(fullImagePath);
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const [existingClient] = await pool.execute('SELECT id FROM clientAdmin WHERE ClientId = ?', [ClientId]);
    if (existingClient.length > 0) {
      if (fullImagePath) await fsPromises.unlink(fullImagePath);
      return res.status(400).json({ message: 'ClientId already exists.' });
    }

    await pool.execute(
      `INSERT INTO clientAdmin (
        ClientId, CompanyName, FirstName, LastName, AdminEmail, Address1, Address2, City,
        State, ZipCode, Phone, Mobile, Password, Question, Answer, AboutUs,
        LicenseQty, Type, profileImage, companylogo, baner
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ClientId, CompanyName, FirstName, LastName, AdminEmail, Address1, Address2, City,
        State, ZipCode, Phone, Mobile, Password, Question, Answer, AboutUs,
        LicenseQty, Type, profileImage, companylogo, baner
      ]
    );

    res.status(201).json({ message: 'Admin created successfully with image.' });
  } catch (err) {
    if (fullImagePath) {
      try {
        await fsPromises.unlink(fullImagePath);
        console.log('Image deleted due to error:', fullImagePath);
      } catch (unlinkErr) {
        console.error('Failed to delete image on error:', unlinkErr);
      }
    }

    console.error('❌ Create error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


/**
 * PUT /api/admin/:id
 * Update an admin with optional image upload
 */
router.put('/:id', multiUpload, async (req, res) => {
  const { id } = req.params;
  const {
    ClientId, CompanyName, FirstName, LastName, AdminEmail, Address1, Address2, City, State, ZipCode, Phone, Mobile, Password, Question, Answer, AboutUs, LicenseQty, Type
  } = req.body;

  const getPath = (file) => file ? file[0].path.replace(/\\/g, '/').split('uploads')[1] : null;

  const profileImage = getPath(req.files['profileImage']);
  const companylogo = getPath(req.files['companylogo']);
  const baner = getPath(req.files['baner']);


  try {
    const [existingMail] = await pool.execute(
      'SELECT id FROM clientAdmin WHERE AdminEmail = ? AND id != ?',
      [AdminEmail, id]
    );
    if (existingMail.length > 0) {
      return res.status(400).json({ message: 'Email already in use by another admin.' });
    }

    const [existingClient] = await pool.execute(
      'SELECT id FROM clientAdmin WHERE ClientId = ? AND id != ?',
      [ClientId, id]
    );
    if (existingClient.length > 0) {
      return res.status(400).json({ message: 'ClientId already in use by another admin.' });
    }

    const updateQuery = `
      UPDATE clientAdmin SET
        ClientId = ?, CompanyName = ?, FirstName = ?, LastName = ?, AdminEmail = ?, Address1 = ?, Address2 = ?, City = ?, State = ?, ZipCode = ?, Phone = ?, Mobile = ?, Password = ?, Question = ?, Answer = ?, AboutUs = ?, LicenseQty = ?, Type = ?
        ${profileImage ? ', profileImage = ?' : ''}
        ${companylogo ? ', companylogo = ?' : ''}
        ${baner ? ', baner = ?' : ''}
      WHERE id = ?`;

    const params = [
      ClientId, CompanyName, FirstName, LastName, AdminEmail, Address1, Address2, City, State, ZipCode, Phone, Mobile, Password, Question, Answer, AboutUs, LicenseQty, Type
    ];

    if (profileImage) params.push(profileImage);
    params.push(id);

    const [result] = await pool.execute(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    res.status(200).json({ message: 'Admin updated successfully.' });
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * GET /api/admin
 * Get all admins
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clientAdmin');
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Read all error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * GET /api/admin/:id
 * Get a single admin by ID
 */
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

/**
 * GET /api/admin/client/:clientId
 * Get admin by ClientId
 */
router.get('/client/:clientId', async (req, res) => {
  const { clientId } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM clientAdmin WHERE ClientId = ?', [clientId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Admin with this ClientId not found.' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('❌ Fetch by ClientId error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * DELETE /api/admin/:id
 * Delete an admin
 */
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

/**
 * POST /api/client-admins/login
 * Login admin with AdminEmail and Password
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM clientAdmin WHERE AdminEmail = ? AND Password = ? LIMIT 1',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: rows[0],
      token: 'dummy-token' // Replace with JWT if needed
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;