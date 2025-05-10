const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.post('/', (req, res) => {
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

  const query = `
    INSERT INTO cvcsem_admin (
      clientAdminFname, clientAdminLname, clientAdminEmail, clientAdminPassword,
      clientAdminRepassword, clientAdmincompanyName, clientAdminAddress,
      clientAdminCity, clientAdminState, clientAdminZipCode,
      clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    clientAdminFname, clientAdminLname, clientAdminEmail, clientAdminPassword,
    clientAdminRepassword, clientAdmincompanyName, clientAdminAddress,
    clientAdminCity, clientAdminState, clientAdminZipCode,
    clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
  ];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database insert failed' });
    res.status(201).json({ message: 'Admin added successfully', adminId: result.insertId });
  });
});

router.get('/', (req, res) => {
  db.query('SELECT * FROM cvcsem_admin', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(results);
  });
});

router.get('/id/:id', (req, res) => {
  db.query('SELECT * FROM cvcsem_admin WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(404).json({ message: 'Admin not found' });
    res.json(results[0]);
  });
});

router.get('/:name', (req, res) => {
  db.query('SELECT * FROM cvcsem_admin WHERE Name = ?', [req.params.name], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length > 0) res.json(results[0]);
    else res.status(404).json({ message: 'Admin not found' });
  });
});

router.put('/:id', (req, res) => {
  const {
    clientAdminFname, clientAdminLname, clientAdminEmail, clientAdminPassword,
    clientAdminRepassword, clientAdmincompanyName, clientAdminAddress,
    clientAdminCity, clientAdminState, clientAdminZipCode,
    clientAdminNumber, clientAdminQuestions, clientAdminLAnswer
  } = req.body;

  const query = `
    UPDATE cvcsem_admin SET
      clientAdminFname = ?, clientAdminLname = ?, clientAdminEmail = ?, clientAdminPassword = ?,
      clientAdminRepassword = ?, clientAdmincompanyName = ?, clientAdminAddress = ?,
      clientAdminCity = ?, clientAdminState = ?, clientAdminZipCode = ?,
      clientAdminNumber = ?, clientAdminQuestions = ?, clientAdminLAnswer = ?
    WHERE id = ?
  `;

  const values = [
    clientAdminFname, clientAdminLname, clientAdminEmail, clientAdminPassword,
    clientAdminRepassword, clientAdmincompanyName, clientAdminAddress,
    clientAdminCity, clientAdminState, clientAdminZipCode,
    clientAdminNumber, clientAdminQuestions, clientAdminLAnswer, req.params.id
  ];

  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ message: 'Update failed' });
    res.json({ message: 'Admin updated successfully' });
  });
});

router.delete('/:id', (req, res) => {
  db.query('DELETE FROM cvcsem_admin WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Delete failed' });
    res.json({ message: 'Admin deleted successfully' });
  });
});

module.exports = router;
