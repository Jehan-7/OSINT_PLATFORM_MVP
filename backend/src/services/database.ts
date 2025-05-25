import { Pool } from 'pg';
import { config } from '../config/environment';

/**
 * PostgreSQL connection pool
 */
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Test database connectivity
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log(`📅 Current time: ${result.rows[0]?.current_time}`);
    console.log(`🗄️  Database: ${result.rows[0]?.db_version?.split(',')[0]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Test PostGIS extension
 * @returns {Promise<boolean>} True if PostGIS is available
 */
export async function testPostGISConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT PostGIS_Version() as postgis_version');
    client.release();
    
    console.log('✅ PostGIS extension available');
    console.log(`🌍 PostGIS version: ${result.rows[0]?.postgis_version}`);
    
    return true;
  } catch (error) {
    console.error('❌ PostGIS extension not available:', error);
    return false;
  }
}

/**
 * Gracefully close database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
} 