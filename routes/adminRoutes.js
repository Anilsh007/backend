const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const bcrypt = require('bcrypt');

// Get all admins
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cvcsem_admin');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
});

// Create admin
router.post('/', async (req, res) => {
  const {
    clientAdminFname, clientAdminLname, clientAdminEmail, clientAdminPassword,
    clientAdminRepassword, clientAdmincompanyName, clientAdminAddress,
    clientAdminCity, clientAdminState, clientAdminZipCode,
    clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
  } = req.body;

  if (
    !clientAdminFname || !clientAdminLname || !clientAdminEmail || !clientAdminPassword ||
    !clientAdminRepassword || !clientAdmincompanyName || !clientAdminAddress ||
    !clientAdminCity || !clientAdminState || !clientAdminZipCode ||
    !clientAdminNumber || !clientAdminQuestions || !clientAdminLAnswer
  ) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (clientAdminPassword !== clientAdminRepassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT 1 FROM cvcsem_admin WHERE clientAdminEmail = ?',
      [clientAdminEmail]
    );

    if (rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(clientAdminPassword, 10);

    const [result] = await pool.execute(
      `INSERT INTO cvcsem_admin (
        clientAdminFname, clientAdminLname, clientAdminEmail, clientAdminPassword,
        clientAdmincompanyName, clientAdminAddress, clientAdminCity, clientAdminState,
        clientAdminZipCode, clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientAdminFname, clientAdminLname, clientAdminEmail, hashedPassword,
        clientAdmincompanyName, clientAdminAddress, clientAdminCity, clientAdminState,
        clientAdminZipCode, clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
      ]
    );

    res.status(201).json({ message: 'Admin created successfully.', adminId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete admin
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM cvcsem_admin WHERE id = ?', [id]);
    res.status(200).json({ message: 'Admin deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete admin.' });
  }
});

// Update admin
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    clientAdminFname, clientAdminLname, clientAdminEmail,
    clientAdmincompanyName, clientAdminAddress, clientAdminCity,
    clientAdminState, clientAdminZipCode, clientAdminNumber,
    clientAdminQuestions, clientAdminLAnswer
  } = req.body;

  try {
    await pool.execute(
      `UPDATE cvcsem_admin SET 
        clientAdminFname = ?, clientAdminLname = ?, clientAdminEmail = ?,
        clientAdmincompanyName = ?, clientAdminAddress = ?, clientAdminCity = ?,
        clientAdminState = ?, clientAdminZipCode = ?, clientAdminNumber = ?,
        clientAdminQuestions = ?, clientAdminLAnswer = ?
      WHERE id = ?`,
      [
        clientAdminFname, clientAdminLname, clientAdminEmail,
        clientAdmincompanyName, clientAdminAddress, clientAdminCity,
        clientAdminState, clientAdminZipCode, clientAdminNumber,
        clientAdminQuestions, clientAdminLAnswer, id
      ]
    );

    res.status(200).json({ message: 'Admin updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update admin.' });
  }
});

module.exports = router;
