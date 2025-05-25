import { Pool } from 'pg';
import { config } from '../../src/config/environment';

// Set timeout for database operations
jest.setTimeout(20000);

describe('Database Setup and Schema', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: config.DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('PostgreSQL Connection', () => {
    it('should establish PostgreSQL connection', async () => {
      const client = await pool.connect();
      expect(client).toBeDefined();
      
      const result = await client.query('SELECT NOW() as current_time');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.current_time).toBeDefined();
      
      client.release();
    });

    it('should have essential environment variables loaded', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Users Table Schema', () => {
    it('should have users table in the database', async () => {
      const client = await pool.connect();
      const result = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.table_name).toBe('users');
      
      client.release();
    });

    it('should have correct users table schema', async () => {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position
      `);

      const columns = result.rows;
      expect(columns).toHaveLength(6);

      // Verify each column
      expect(columns[0]).toMatchObject({
        column_name: 'id',
        data_type: 'integer',
        is_nullable: 'NO'
      });

      expect(columns[1]).toMatchObject({
        column_name: 'username',
        data_type: 'character varying',
        is_nullable: 'NO'
      });

      expect(columns[2]).toMatchObject({
        column_name: 'email',
        data_type: 'character varying',
        is_nullable: 'NO'
      });

      expect(columns[3]).toMatchObject({
        column_name: 'password_hash',
        data_type: 'character varying',
        is_nullable: 'NO'
      });

      expect(columns[4]).toMatchObject({
        column_name: 'reputation',
        data_type: 'integer',
        is_nullable: 'YES',
        column_default: '0'
      });

      expect(columns[5]).toMatchObject({
        column_name: 'created_at',
        data_type: 'timestamp with time zone',
        is_nullable: 'YES'
      });

      client.release();
    });

    it('should have unique constraints on username and email', async () => {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT constraint_name, column_name
        FROM information_schema.key_column_usage
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY constraint_name
      `);

      const constraints = result.rows;
      expect(constraints.length).toBe(3); // Primary key + 2 unique constraints

      // Check for username and email unique constraints
      const constraintColumns = constraints.map(c => c.column_name);
      expect(constraintColumns).toContain('username');
      expect(constraintColumns).toContain('email');
      expect(constraintColumns).toContain('id'); // Primary key

      client.release();
    });

    it('should have indexes on username and email for performance', async () => {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT indexname, tablename, indexdef
        FROM pg_indexes
        WHERE tablename = 'users' AND schemaname = 'public'
        ORDER BY indexname
      `);

      const indexes = result.rows;
      expect(indexes.length).toBeGreaterThanOrEqual(3); // Primary key + username + email indexes

      const indexNames = indexes.map(idx => idx.indexname);
      expect(indexNames.some(name => name.includes('username'))).toBe(true);
      expect(indexNames.some(name => name.includes('email'))).toBe(true);

      client.release();
    });
  });

  describe('Database Operations', () => {
    it('should allow inserting a test user', async () => {
      const client = await pool.connect();
      
      // Clean up any existing test data
      await client.query("DELETE FROM users WHERE email = 'test@example.com'");
      
      // Insert test user
      const insertResult = await client.query(`
        INSERT INTO users (username, email, password_hash, reputation, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, reputation, created_at
      `, ['testuser', 'test@example.com', 'hashedpassword123', 0, new Date()]);

      expect(insertResult.rows).toHaveLength(1);
      const user = insertResult.rows[0];
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.reputation).toBe(0);
      expect(user.created_at).toBeDefined();

      // Clean up
      await client.query("DELETE FROM users WHERE email = 'test@example.com'");
      
      client.release();
    });

    it('should enforce unique constraints on username and email', async () => {
      const client = await pool.connect();
      
      // Clean up any existing test data
      await client.query("DELETE FROM users WHERE email IN ('unique1@example.com', 'unique2@example.com')");
      
      // Insert first user
      await client.query(`
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
      `, ['uniqueuser', 'unique1@example.com', 'hash123']);

      // Try to insert user with duplicate username
      await expect(
        client.query(`
          INSERT INTO users (username, email, password_hash)
          VALUES ($1, $2, $3)
        `, ['uniqueuser', 'unique2@example.com', 'hash456'])
      ).rejects.toThrow();

      // Try to insert user with duplicate email
      await expect(
        client.query(`
          INSERT INTO users (username, email, password_hash)
          VALUES ($1, $2, $3)
        `, ['anotheruser', 'unique1@example.com', 'hash789'])
      ).rejects.toThrow();

      // Clean up
      await client.query("DELETE FROM users WHERE email IN ('unique1@example.com', 'unique2@example.com')");
      
      client.release();
    });
  });
}); 