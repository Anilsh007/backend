const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { pool } = require("../utils/db");

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "7d"; // 7 days

// ✅ POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    // Find admin by email
    const [rows] = await pool.execute(
      "SELECT * FROM clientAdmin WHERE AdminEmail = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const admin = rows[0];

    // Simple password check (not bcrypt)
    if (admin.Password !== password)
      return res.status(401).json({ message: "Invalid email or password" });

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.AdminEmail, type: admin.Type },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    delete admin.Password;

    res.status(200).json({
      message: "Login successful",
      user: admin,
      token,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
