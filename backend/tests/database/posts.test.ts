import { Pool } from 'pg';
import { config } from '../../src/config/environment';

// Set timeout for database operations
jest.setTimeout(30000);

describe('Posts Table Database Schema', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ 
      connectionString: config.DATABASE_URL,
      max: 5, // Limit pool size for tests
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 2000
    });
  });

  afterAll(async () => {
    try {
      await pool.end();
    } catch (error) {
      console.warn('Error closing database pool:', error);
    }
  });

  describe('Posts Table Schema', () => {
    it('should have posts table in the database', async () => {
      const client = await pool.connect();
      
      try {
        // Debug: Check current database and schema
        const dbInfo = await client.query('SELECT current_database(), current_schema()');
        console.log('Database info:', dbInfo.rows[0]);
        
        // Debug: List all tables
        const allTables = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);
        console.log('All tables in public schema:', allTables.rows);
        
        const result = await client.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts'"
        );
        
        console.log('Posts table query result:', result.rows);
        
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]?.table_name).toBe('posts');
      } finally {
        client.release();
      }
    });

    it('should have correct posts table schema', async () => {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'posts'
          ORDER BY ordinal_position
        `);

        const columns = result.rows;
        expect(columns).toHaveLength(10);

        // Verify each column according to Sprint 2 requirements
        expect(columns[0]).toMatchObject({
          column_name: 'id',
          data_type: 'integer',
          is_nullable: 'NO'
        });

        expect(columns[1]).toMatchObject({
          column_name: 'author_id',
          data_type: 'integer',
          is_nullable: 'NO'
        });

        expect(columns[2]).toMatchObject({
          column_name: 'content',
          data_type: 'text',
          is_nullable: 'NO'
        });

        expect(columns[3]).toMatchObject({
          column_name: 'latitude',
          data_type: 'numeric',
          is_nullable: 'NO',
          numeric_precision: 10,
          numeric_scale: 8
        });

        expect(columns[4]).toMatchObject({
          column_name: 'longitude',
          data_type: 'numeric',
          is_nullable: 'NO',
          numeric_precision: 11,
          numeric_scale: 8
        });

        expect(columns[5]).toMatchObject({
          column_name: 'location_name',
          data_type: 'character varying',
          is_nullable: 'YES',
          character_maximum_length: 255
        });

        expect(columns[6]).toMatchObject({
          column_name: 'upvotes',
          data_type: 'integer',
          is_nullable: 'YES',
          column_default: '0'
        });

        expect(columns[7]).toMatchObject({
          column_name: 'downvotes',
          data_type: 'integer',
          is_nullable: 'YES',
          column_default: '0'
        });

        expect(columns[8]).toMatchObject({
          column_name: 'created_at',
          data_type: 'timestamp with time zone',
          is_nullable: 'YES'
        });

        expect(columns[9]).toMatchObject({
          column_name: 'updated_at',
          data_type: 'timestamp with time zone',
          is_nullable: 'YES'
        });
      } finally {
        client.release();
      }
    });

    it('should have foreign key constraint on author_id referencing users table', async () => {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'posts'
            AND kcu.column_name = 'author_id'
        `);

        expect(result.rows).toHaveLength(1);
        const foreignKey = result.rows[0];
        expect(foreignKey.foreign_table_name).toBe('users');
        expect(foreignKey.foreign_column_name).toBe('id');
      } finally {
        client.release();
      }
    });

    it('should have check constraints for content length and coordinate ranges', async () => {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT constraint_name, check_clause
          FROM information_schema.check_constraints
          WHERE constraint_schema = 'public'
          AND constraint_name LIKE '%posts%'
          ORDER BY constraint_name
        `);

        const constraints = result.rows;
        expect(constraints.length).toBeGreaterThanOrEqual(3);

        // Check for content length constraint (1000 characters max)
        const contentConstraint = constraints.find(c => 
          c.check_clause.includes('content') && c.check_clause.includes('1000')
        );
        expect(contentConstraint).toBeDefined();

        // Check for latitude range constraint (-90 to 90)
        const latConstraint = constraints.find(c => 
          c.check_clause.includes('latitude') && c.check_clause.includes('-90') && c.check_clause.includes('90')
        );
        expect(latConstraint).toBeDefined();

        // Check for longitude range constraint (-180 to 180)
        const lngConstraint = constraints.find(c => 
          c.check_clause.includes('longitude') && c.check_clause.includes('-180') && c.check_clause.includes('180')
        );
        expect(lngConstraint).toBeDefined();
      } finally {
        client.release();
      }
    });

    it('should have performance indexes on key columns', async () => {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT indexname, tablename, indexdef
          FROM pg_indexes
          WHERE tablename = 'posts' AND schemaname = 'public'
          ORDER BY indexname
        `);

        const indexes = result.rows;
        expect(indexes.length).toBeGreaterThanOrEqual(4); // Primary key + author_id + created_at + location

        const indexNames = indexes.map(idx => idx.indexname);
        
        // Check for author_id index
        expect(indexNames.some(name => name.includes('author_id'))).toBe(true);
        
        // Check for created_at index (descending for recent posts)
        expect(indexNames.some(name => name.includes('created_at'))).toBe(true);
        
        // Check for location index (lat, lng composite)
        expect(indexNames.some(name => name.includes('location'))).toBe(true);
      } finally {
        client.release();
      }
    });

    it('should have updated_at trigger function and trigger', async () => {
      const client = await pool.connect();
      
      try {
        // Check for trigger function
        const functionResult = await client.query(`
          SELECT routine_name
          FROM information_schema.routines
          WHERE routine_schema = 'public'
          AND routine_name = 'update_updated_at_column'
          AND routine_type = 'FUNCTION'
        `);
        expect(functionResult.rows).toHaveLength(1);

        // Check for trigger
        const triggerResult = await client.query(`
          SELECT trigger_name, event_manipulation, action_timing
          FROM information_schema.triggers
          WHERE event_object_table = 'posts'
          AND trigger_name = 'posts_updated_at_trigger'
        `);
        expect(triggerResult.rows).toHaveLength(1);
        expect(triggerResult.rows[0].event_manipulation).toBe('UPDATE');
        expect(triggerResult.rows[0].action_timing).toBe('BEFORE');
      } finally {
        client.release();
      }
    });
  });

  describe('Posts Table Operations', () => {
    let testUserId: number;

    beforeAll(async () => {
      const client = await pool.connect();
      
      try {
        // Clean up any existing test data
        await client.query("DELETE FROM posts WHERE content LIKE 'Test post%'");
        await client.query("DELETE FROM users WHERE email = 'posttest@example.com'");
        
        // Create a test user for foreign key relationships
        const userResult = await client.query(`
          INSERT INTO users (username, email, password_hash, reputation, created_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, ['posttestuser', 'posttest@example.com', 'hashedpassword123', 0, new Date()]);
        
        testUserId = userResult.rows[0].id;
      } finally {
        client.release();
      }
    });

    afterAll(async () => {
      const client = await pool.connect();
      try {
        // Clean up test data
        await client.query("DELETE FROM posts WHERE content LIKE 'Test post%'");
        await client.query("DELETE FROM users WHERE email = 'posttest@example.com'");
      } finally {
        client.release();
      }
    });

    beforeEach(async () => {
      // Clean up posts before each test to ensure isolation
      const client = await pool.connect();
      try {
        await client.query("DELETE FROM posts WHERE content LIKE 'Test post%'");
      } finally {
        client.release();
      }
    });

    it('should allow inserting a valid post', async () => {
      const client = await pool.connect();
      
      try {
        const insertResult = await client.query(`
          INSERT INTO posts (author_id, content, latitude, longitude, location_name, upvotes, downvotes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, author_id, content, latitude, longitude, location_name, upvotes, downvotes, created_at, updated_at
        `, [
          testUserId,
          'Test post content for database validation',
          40.7829,
          -73.9654,
          'Central Park, NYC',
          0,
          0,
          new Date(),
          new Date()
        ]);

        expect(insertResult.rows).toHaveLength(1);
        const post = insertResult.rows[0];
        expect(post.id).toBeDefined();
        expect(post.author_id).toBe(testUserId);
        expect(post.content).toBe('Test post content for database validation');
        expect(parseFloat(post.latitude)).toBe(40.7829);
        expect(parseFloat(post.longitude)).toBe(-73.9654);
        expect(post.location_name).toBe('Central Park, NYC');
        expect(post.upvotes).toBe(0);
        expect(post.downvotes).toBe(0);
        expect(post.created_at).toBeDefined();
        expect(post.updated_at).toBeDefined();
      } finally {
        client.release();
      }
    });

    it('should enforce content length constraint (max 1000 characters)', async () => {
      const client = await pool.connect();
      
      try {
        const longContent = 'a'.repeat(1001); // 1001 characters
        
        await expect(
          client.query(`
            INSERT INTO posts (author_id, content, latitude, longitude)
            VALUES ($1, $2, $3, $4)
          `, [testUserId, longContent, 40.7829, -73.9654])
        ).rejects.toThrow();
      } finally {
        client.release();
      }
    });

    it('should enforce latitude range constraint (-90 to 90)', async () => {
      const client = await pool.connect();
      
      try {
        // Test latitude > 90
        await expect(
          client.query(`
            INSERT INTO posts (author_id, content, latitude, longitude)
            VALUES ($1, $2, $3, $4)
          `, [testUserId, 'Test post invalid lat high', 91, -73.9654])
        ).rejects.toThrow();

        // Test latitude < -90
        await expect(
          client.query(`
            INSERT INTO posts (author_id, content, latitude, longitude)
            VALUES ($1, $2, $3, $4)
          `, [testUserId, 'Test post invalid lat low', -91, -73.9654])
        ).rejects.toThrow();
      } finally {
        client.release();
      }
    });

    it('should enforce longitude range constraint (-180 to 180)', async () => {
      const client = await pool.connect();
      
      try {
        // Test longitude > 180
        await expect(
          client.query(`
            INSERT INTO posts (author_id, content, latitude, longitude)
            VALUES ($1, $2, $3, $4)
          `, [testUserId, 'Test post invalid lng high', 40.7829, 181])
        ).rejects.toThrow();

        // Test longitude < -180
        await expect(
          client.query(`
            INSERT INTO posts (author_id, content, latitude, longitude)
            VALUES ($1, $2, $3, $4)
          `, [testUserId, 'Test post invalid lng low', 40.7829, -181])
        ).rejects.toThrow();
      } finally {
        client.release();
      }
    });

    it('should enforce foreign key constraint on author_id', async () => {
      const client = await pool.connect();
      
      try {
        const nonExistentUserId = 999999;
        
        await expect(
          client.query(`
            INSERT INTO posts (author_id, content, latitude, longitude)
            VALUES ($1, $2, $3, $4)
          `, [nonExistentUserId, 'Test post invalid author', 40.7829, -73.9654])
        ).rejects.toThrow();
      } finally {
        client.release();
      }
    });

    it('should automatically update updated_at timestamp on UPDATE', async () => {
      const client = await pool.connect();
      
      try {
        // Insert a post
        const insertResult = await client.query(`
          INSERT INTO posts (author_id, content, latitude, longitude)
          VALUES ($1, $2, $3, $4)
          RETURNING id, updated_at
        `, [testUserId, 'Test post for update trigger', 40.7829, -73.9654]);
        
        const postId = insertResult.rows[0].id;
        const originalUpdatedAt = insertResult.rows[0].updated_at;
        
        // Wait a moment to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the post
        const updateResult = await client.query(`
          UPDATE posts 
          SET content = $1
          WHERE id = $2
          RETURNING updated_at
        `, ['Test post updated content', postId]);
        
        expect(updateResult.rows).toHaveLength(1);
        const newUpdatedAt = updateResult.rows[0].updated_at;
        
        // Verify updated_at was automatically updated
        expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
      } finally {
        client.release();
      }
    });

    it('should allow posts with boundary coordinate values', async () => {
      const client = await pool.connect();
      
      try {
        // Test boundary values
        const boundaryTests = [
          { lat: 90, lng: 180, desc: 'max values' },
          { lat: -90, lng: -180, desc: 'min values' },
          { lat: 0, lng: 0, desc: 'zero values' }
        ];
        
        for (const test of boundaryTests) {
          const result = await client.query(`
            INSERT INTO posts (author_id, content, latitude, longitude)
            VALUES ($1, $2, $3, $4)
            RETURNING id, latitude, longitude
          `, [testUserId, `Test post boundary ${test.desc}`, test.lat, test.lng]);
          
          expect(result.rows).toHaveLength(1);
          expect(parseFloat(result.rows[0].latitude)).toBe(test.lat);
          expect(parseFloat(result.rows[0].longitude)).toBe(test.lng);
        }
      } finally {
        client.release();
      }
    });
  });
}); 