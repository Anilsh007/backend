const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  const {
    clientAdminFname, clientAdminLname, clientAdminEmail, clientAdminPassword,
    clientAdminRepassword, clientAdmincompanyName, clientAdminAddress,
    clientAdminCity, clientAdminState, clientAdminZipCode,
    clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
  } = req.body;

  // Field validation
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
    // Check for existing email
    console.log(`Checking email: ${clientAdminEmail}`);
    const [rows] = await db.promise().execute(
      'SELECT 1 FROM cvcsem_admin WHERE clientAdminEmail = ?',
      [clientAdminEmail]
    );

    if (rows.length > 0) {
      console.log('Email already exists.');
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(clientAdminPassword, 10);

    // Insert user
    const insertQuery = `
      INSERT INTO cvcsem_admin (
        clientAdminFname, clientAdminLname, clientAdminEmail, clientAdminPassword,
        clientAdmincompanyName, clientAdminAddress, clientAdminCity, clientAdminState,
        clientAdminZipCode, clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.promise().execute(insertQuery, [
      clientAdminFname, clientAdminLname, clientAdminEmail, hashedPassword,
      clientAdmincompanyName, clientAdminAddress, clientAdminCity, clientAdminState,
      clientAdminZipCode, clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
    ]);

    return res.status(201).json({ message: 'Admin created successfully.' });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
