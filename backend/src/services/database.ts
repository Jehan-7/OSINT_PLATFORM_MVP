import { Pool, PoolClient } from 'pg';
import { config } from '../config/environment';

/**
 * Database service for OSINT Platform
 * Handles PostgreSQL connections with PostGIS support
 * Sprint 1: Basic connection management for user authentication
 */
class DatabaseService {
  private pool: Pool;
  private static instance: DatabaseService;

  private constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  /**
   * Get singleton instance of DatabaseService
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get a client from the connection pool
   */
  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Execute a query with automatic client management
   */
  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Test database connectivity
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('Database connected successfully:', {
        time: result.rows[0]?.current_time,
        version: result.rows[0]?.pg_version?.split(' ')[0]
      });
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Check if users table exists (Sprint 1 requirement)
   */
  public async checkUsersTable(): Promise<boolean> {
    try {
      const result = await this.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      `);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking users table:', error);
      return false;
    }
  }

  /**
   * Close all connections in the pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();

/**
 * Test PostGIS extension
 * @returns {Promise<boolean>} True if PostGIS is available
 */
export async function testPostGISConnection(): Promise<boolean> {
  try {
    const client = await db.getClient();
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
    await db.close();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
} 