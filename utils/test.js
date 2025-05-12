const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'srv461.hstgr.io',
      user: 'u540711149_cvcsem_admin',
      password: 'Cvcsem2025!admin',
      database: 'u540711149_cvcsem_db',
    });

    console.log('✅ Connected successfully!');
    await connection.end();
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

test();
