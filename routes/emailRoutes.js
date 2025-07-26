const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post('/send', upload.array('attachments'), async (req, res) => {
  const { to, cc, bcc, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const attachments = req.files?.map(file => ({
    filename: file.originalname,
    content: file.buffer,
  })) || [];

  try {
    await transporter.sendMail({
      from: `"CVCSEM Admin" <admin@cvcsem.com>`,
      to,
      cc,
      bcc,
      subject,
      html: body,
      attachments,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

module.exports = router;