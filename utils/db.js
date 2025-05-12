const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export pool and test function
async function testDBConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully.');
    connection.release(); // release to pool
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error); // <-- log full error object
    process.exit(1); // Exit app if DB not connected
  }
}

module.exports = { pool, testDBConnection };

// Allow standalone test if run directly
if (require.main === module) {
  testDBConnection();
}
