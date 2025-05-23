const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');

// CREATE vendor with duplicate email check
router.post('/', async (req, res) => {
  try {
    const {
      ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
      Address1, Address2, City, State, ZipCode,
      Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
      Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
      Phone, Mobile, Sbclass, Class, UserId, Password,
      SecQuestion, SecAnswer, Aboutus, Type
    } = req.body;

    // Check for duplicate email
    const [existing] = await pool.query('SELECT id FROM vendorRegister WHERE Email = ?', [Email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const sql = `
      INSERT INTO vendorRegister (
        ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
        Address1, Address2, City, State, ZipCode,
        Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
        Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
        Phone, Mobile, Sbclass, Class, UserId, Password,
        SecQuestion, SecAnswer, Aboutus, Type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
      Address1, Address2, City, State, ZipCode,
      Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
      Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
      Phone, Mobile, Sbclass, Class, UserId, Password,
      SecQuestion, SecAnswer, Aboutus, Type
    ];

    await pool.query(sql, values);
    res.json({ success: true, message: 'Vendor added successfully.' });
  } catch (err) {
    console.error('Create Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// READ all vendors
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vendorRegister');
    res.json(rows);
  } catch (err) {
    console.error('Read All Error:', err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// UPDATE vendor
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
      Address1, Address2, City, State, ZipCode,
      Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
      Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
      Phone, Mobile, Sbclass, Class, UserId, Password,
      SecQuestion, SecAnswer, Aboutus, Type
    } = req.body;

    const sql = `
      UPDATE vendorRegister SET
        ClientId=?, vendorcode = ?, vendorcompanyname = ?, Fname = ?, Lname = ?, Email = ?,
        Address1 = ?, Address2 = ?, City = ?, State = ?, ZipCode = ?,
        Samuin = ?, Fein = ?, Duns = ?, Naics1 = ?, Naics2 = ?, Naics3 = ?, Naics4 = ?, Naics5 = ?,
        Nigp1 = ?, Nigp2 = ?, Nigp3 = ?, Nigp4 = ?, Nigp5 = ?,
        Phone = ?, Mobile = ?, Sbclass = ?, Class = ?, UserId = ?, Password = ?,
        SecQuestion = ?, SecAnswer = ?, Aboutus = ?, Type = ?
      WHERE id = ?
    `;
    const values = [
      ClientId, vendorcode, vendorcompanyname, Fname, Lname, Email,
      Address1, Address2, City, State, ZipCode,
      Samuin, Fein, Duns, Naics1, Naics2, Naics3, Naics4, Naics5,
      Nigp1, Nigp2, Nigp3, Nigp4, Nigp5,
      Phone, Mobile, Sbclass, Class, UserId, Password,
      SecQuestion, SecAnswer, Aboutus, Type,
      id
    ];

    await pool.query(sql, values);
    res.json({ success: true, message: 'Vendor updated successfully.' });
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// DELETE vendor
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM vendorRegister WHERE id = ?', [id]);
    res.json({ success: true, message: 'Vendor deleted successfully.' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

module.exports = router;
