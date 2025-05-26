const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load test environment exactly like the tests do
dotenv.config({ path: path.join(__dirname, 'env.test') });

async function debugDatabase() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL
  });

  try {
    const client = await pool.connect();
    
    console.log('Connected to database successfully');
    
    // Check all tables
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('All tables:', allTables.rows);
    
    // Check specifically for posts table
    const postsTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'posts'
    `);
    console.log('Posts table query result:', postsTable.rows);
    
    client.release();
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

debugDatabase(); 