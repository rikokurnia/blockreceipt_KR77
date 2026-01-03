// test-db.js
require('dotenv').config();
const { Client } = require('pg');

const testConnection = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable not found.');
    console.error('Please ensure your .env file is correct.');
    return;
  }

  console.log('Attempting to connect to the database...');
  console.log('Target: ' + new URL(connectionString).hostname);

  const client = new Client({
    connectionString: connectionString,
    // Adding a connection timeout is crucial for testing
    connectionTimeoutMillis: 10000, // 10 seconds
  });

  try {
    await client.connect();
    console.log('\n✅ SUCCESS: Database connection established successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL server time:', res.rows[0].now);
  } catch (err) {
    console.error('\n❌ ERROR: Failed to connect to the database.');
    console.error('------------------------------------------');
    console.error('Error details:', err.message);
    console.error('------------------------------------------');
    console.error('Troubleshooting steps:');
    console.error('1. Verify the DATABASE_URL in your .env file is correct (password, hostname, etc.).');
    console.error('2. Check if a firewall on your computer or network is blocking outbound traffic on port 6543.');
    console.error('3. Ensure the database on Supabase is not paused.');
  } finally {
    await client.end();
    console.log('\nConnection test finished.');
  }
};

testConnection();
