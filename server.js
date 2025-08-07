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

// ✅ Increase body size limits for JSON and URL-encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Serve static files from 'public' folder
app.use(express.static('public'));

// ✅ Serve uploaded images statically from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Client User routes
const clientAdminRoutes = require('./routes/clientAdmin');
app.use('/api/client-admins', clientAdminRoutes);

// ✅ Vendor routes
const vendorRoutes = require('./routes/vendorRoutes');
app.use('/api/vendors', vendorRoutes);

// ✅ User routes
const clientUser = require('./routes/clientUser');
app.use('/api/clientUser', clientUser);

// ✅ Email routes
const emailRoutes = require('./routes/emailRoutes');
app.use('/api/email', emailRoutes);

// ✅ Matchmaking routes
const matchMakingRoutes = require('./routes/matchMaking');
app.use('/api/matchmaking', matchMakingRoutes);

// ✅ Start server after DB check
async function startServer() {
  await testDBConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  });
}

startServer();
