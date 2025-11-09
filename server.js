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

// ✅ Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Route Imports
const clientAdminRoutes = require('./routes/clientAdmin');
const vendorRoutes = require('./routes/vendorRoutes');
const clientUserRoutes = require('./routes/clientUser');
const emailRoutes = require('./routes/emailRoutes');
const matchMakingRoutes = require('./routes/matchMaking');
const mmSlotBookRoutes = require('./routes/mmSlotBook');

// ✅ NEW — Auth Routes (Login & Logout)
const authRoutes = require('./routes/auth');

// ✅ Route Mounts
app.use('/api/client-admins', clientAdminRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/clientUser', clientUserRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/matchmaking', matchMakingRoutes);
app.use('/api/mmSlotBook', mmSlotBookRoutes);

// ✅ Mount Auth Route
app.use('/api/auth', authRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

// ✅ Start Server
async function startServer() {
  await testDBConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  });
}

startServer();