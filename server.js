require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testDBConnection } = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Updated CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://cvcsem.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use(express.static('public'));
const clientAdminRoutes = require('./routes/clientAdmin');
app.use('/api/client-admins', clientAdminRoutes);

const vendorRoutes = require('./routes/vendorRoutes');
app.use('/uploads', express.static('uploads'));
app.use('/api/vendors', vendorRoutes);


async function startServer() {
  await testDBConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  });
}

startServer();
