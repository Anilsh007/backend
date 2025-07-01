const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Setup transporter with your Hostinger SMTP config
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: process.env.EMAIL_USER, // = admin@cvcsem.com
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/email/send
router.post('/send', async (req, res) => {
  const { to, cc, bcc, subject, body } = req.body;

  // Validate essential fields
  if (!to || !subject || !body) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await transporter.sendMail({
      from: `"CVCSEM Admin" <admin@cvcsem.com>`, // always send from this
      to,
      cc,
      bcc,
      subject,
      text: body,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

module.exports = router;
