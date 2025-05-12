require('dotenv').config();
const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const { testDBConnection } = require('./utils/db'); // <-- IMPORT THIS


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/admin', adminRoutes);

async function startServer() {
  await testDBConnection(); // <-- TEST DB
  app.listen(PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  });
}

startServer();
