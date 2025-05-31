require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testDBConnection } = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://cvcsem.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ✅ Body parser for JSON
app.use(express.json());

// ✅ Serve static files from 'public' folder
app.use(express.static('public'));

// ✅ Serve uploaded images statically from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes
const clientAdminRoutes = require('./routes/clientAdmin');
app.use('/api/client-admins', clientAdminRoutes);

const vendorRoutes = require('./routes/vendorRoutes');
app.use('/api/vendors', vendorRoutes);

// ✅ Start server after DB check
async function startServer() {
  await testDBConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  });
}

startServer();
