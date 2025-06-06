const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

// Multer storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { ClientId, UserCode } = req.body;
    if (!ClientId || !UserCode) return cb(new Error('ClientId and UserCode are required'));

    const dir = path.join(__dirname, '..', 'uploads', ClientId, `User_${UserCode}`);
    try {
      await fsPromises.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'profileImage' + ext);
  }
});

// Multer file filter
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      return cb(new Error('Only PNG, JPG, and JPEG files are allowed.'));
    }
    cb(null, true);
  }
});

// Convert file path to relative path
const getPath = (file) => {
  if (!file) return null;
  const relativePath = path.relative(path.join(__dirname, '..', 'uploads'), file.path);
  return relativePath.replace(/\\/g, '/');
};

// CREATE user
router.post('/', upload.single('profileImage'), async (req, res) => {
  try {
    const {
      ClientId, UserCode, Fname, Lname, Email, Password, Mobile,
      Gender, Question, Answer, DateTime, Type
    } = req.body;

    const profileImage = getPath(req.file);

    // Check for duplicate email
    const [existing] = await pool.execute(
      'SELECT id FROM clientUsers WHERE Email = ?',
      [Email.trim().toLowerCase()]
    );
    if (existing.length > 0) {
      if (req.file) await fsPromises.unlink(req.file.path);
      return res.status(400).json({ message: 'Email already registered.' });
    }

    await pool.execute(
      `INSERT INTO clientUsers 
      (ClientId, UserCode, Fname, Lname, Email, Password, Mobile, Gender, Question, Answer, profileImage, DateTime, Type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ClientId, UserCode, Fname, Lname, Email.trim().toLowerCase(), Password,
        Mobile, Gender, Question, Answer, profileImage, DateTime, Type
      ]
    );

    res.status(201).json({ message: 'Client user created successfully.' });
  } catch (err) {
    console.error('❌ Create user error:', err);
    if (req.file) await fsPromises.unlink(req.file.path);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// READ all users (exclude password)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, ClientId, UserCode, Fname, Lname, Email, Password, Mobile, Gender, Question, Answer, profileImage, DateTime, Type 
       FROM clientUsers`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Read all error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// READ user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, ClientId, UserCode, Fname, Lname, Email, Password, Mobile, Gender, Question, Answer, profileImage, DateTime, Type 
       FROM clientUsers WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('❌ Read one error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// READ users by ClientId
router.get('/clientUser/:clientId', async (req, res) => {
  const { clientId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT id, ClientId, UserCode, Fname, Lname, Email, Mobile, Gender, Question, Answer, profileImage, DateTime, Type 
       FROM clientUsers WHERE ClientId = ?`,
      [clientId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No users found for this ClientId.' });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Read by ClientId error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// UPDATE user by ID
router.put('/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ClientId, UserCode, Fname, Lname, Email, Password, Mobile,
      Gender, Question, Answer, DateTime, Type
    } = req.body;

    const profileImage = getPath(req.file);

    // Check for duplicate email on other user
    const [existing] = await pool.execute(
      'SELECT id FROM clientUsers WHERE Email = ? AND id != ?',
      [Email.trim().toLowerCase(), id]
    );
    if (existing.length > 0) {
      if (req.file) await fsPromises.unlink(req.file.path);
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // Delete old profile image if new one is uploaded
    if (req.file) {
      const [old] = await pool.execute('SELECT profileImage FROM clientUsers WHERE id = ?', [id]);
      if (old.length && old[0].profileImage) {
        const oldPath = path.join(__dirname, '..', 'uploads', old[0].profileImage);
        if (fs.existsSync(oldPath)) await fsPromises.unlink(oldPath);
      }
    }

    let updateFields = `
      ClientId = ?, UserCode = ?, Fname = ?, Lname = ?, Email = ?, Password = ?, 
      Mobile = ?, Gender = ?, Question = ?, Answer = ?, DateTime = ?, Type = ?`;
    const values = [
      ClientId, UserCode, Fname, Lname, Email.trim().toLowerCase(), Password,
      Mobile, Gender, Question, Answer, DateTime, Type
    ];

    if (profileImage) {
      updateFields += ', profileImage = ?';
      values.push(profileImage);
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE clientUsers SET ${updateFields} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error('❌ Update error:', err);
    if (req.file) await fsPromises.unlink(req.file.path);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE user by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute('SELECT profileImage FROM clientUsers WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });

    const imagePath = rows[0].profileImage
      ? path.join(__dirname, '..', 'uploads', rows[0].profileImage)
      : null;

    await pool.execute('DELETE FROM clientUsers WHERE id = ?', [id]);

    if (imagePath && fs.existsSync(imagePath)) {
      await fsPromises.unlink(imagePath);
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ message: 'Internal server error.' });
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
      'SELECT * FROM clientUsers WHERE Email = ? AND Password = ? LIMIT 1',
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
