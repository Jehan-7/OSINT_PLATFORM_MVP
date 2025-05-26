import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/services/database';
import bcrypt from 'bcrypt';

describe('Posts API Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {

    // Clean up existing data
    await db.query('TRUNCATE TABLE posts, users CASCADE');

    // Create a test user for authentication
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    const userResult = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      ['testuser', 'test@example.com', hashedPassword]
    );
    testUser = userResult.rows[0];

    // Get auth token by logging in
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await db.query('TRUNCATE TABLE posts, users CASCADE');
  });

  beforeEach(async () => {
    // Clean posts before each test but keep the user
    await db.query('DELETE FROM posts');
  });

  describe('POST /api/v1/posts', () => {
    it('should create a post successfully with authentication', async () => {
      const postData = {
        content: 'Test post content for integration testing',
        latitude: 40.7829,
        longitude: -73.9654,
        location_name: 'Central Park, NYC'
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post created successfully');
      expect(response.body.data).toMatchObject({
        content: postData.content,
        latitude: postData.latitude,
        longitude: postData.longitude,
        location_name: postData.location_name,
        author_id: testUser.id,
        upvotes: 0,
        downvotes: 0
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.created_at).toBeDefined();
    });

    it('should reject post creation without authentication', async () => {
      const postData = {
        content: 'Test post without auth',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .send(postData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should reject post creation with invalid data', async () => {
      const postData = {
        content: '', // Empty content should fail
        latitude: 91, // Invalid latitude
        longitude: -73.9654
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject post creation with invalid JWT token', async () => {
      const postData = {
        content: 'Test post with bad token',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer invalid-token')
        .send(postData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });
  });

  describe('GET /api/v1/posts', () => {
    beforeEach(async () => {
      // Create some test posts
      await db.query(
        'INSERT INTO posts (author_id, content, latitude, longitude, created_at) VALUES ($1, $2, $3, $4, $5)',
        [testUser.id, 'First test post', 40.7829, -73.9654, new Date(Date.now() - 10000)]
      );
      await db.query(
        'INSERT INTO posts (author_id, content, latitude, longitude, created_at) VALUES ($1, $2, $3, $4, $5)',
        [testUser.id, 'Second test post', 41.8781, -87.6298, new Date()]
      );
    });

    it('should retrieve paginated list of posts', async () => {
      const response = await request(app)
        .get('/api/v1/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });

      // Posts should be ordered by creation date (newest first)
      expect(response.body.data.posts[0].content).toBe('Second test post');
      expect(response.body.data.posts[1].content).toBe('First test post');

      // Each post should include author information
      expect(response.body.data.posts[0].author).toMatchObject({
        id: testUser.id,
        username: testUser.username,
        reputation: testUser.reputation
      });
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2
      });
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=-1&limit=1000')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    let testPost: any;

    beforeEach(async () => {
      // Create a test post
      const result = await db.query(
        'INSERT INTO posts (author_id, content, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
        [testUser.id, 'Specific test post', 40.7829, -73.9654]
      );
      testPost = result.rows[0];
    });

    it('should retrieve a specific post by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/posts/${testPost.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testPost.id,
        content: 'Specific test post',
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        author_id: testUser.id
      });
      expect(response.body.data.author).toMatchObject({
        id: testUser.id,
        username: testUser.username,
        reputation: testUser.reputation
      });
    });

    it('should return 404 for non-existent post', async () => {
      const nonExistentId = testPost.id + 999;
      const response = await request(app)
        .get(`/api/v1/posts/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Post not found');
    });

    it('should return 400 for invalid post ID format', async () => {
      const response = await request(app)
        .get('/api/v1/posts/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid post ID format');
    });
  });

  describe('GET /api/v1/users/:userId/posts', () => {
    let otherUser: any;

    beforeEach(async () => {
      // Create another user with unique name
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('OtherPassword123!', 12);
      const userResult = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [`otheruser_${timestamp}`, `other_${timestamp}@example.com`, hashedPassword]
      );
      otherUser = userResult.rows[0];

      // Create posts for both users
      await db.query(
        'INSERT INTO posts (author_id, content, latitude, longitude) VALUES ($1, $2, $3, $4)',
        [testUser.id, 'Post by test user', 40.7829, -73.9654]
      );
      await db.query(
        'INSERT INTO posts (author_id, content, latitude, longitude) VALUES ($1, $2, $3, $4)',
        [otherUser.id, 'Post by other user', 41.8781, -87.6298]
      );
    });

    it('should retrieve posts by specific author', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}/posts`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].content).toBe('Post by test user');
      expect(response.body.data.posts[0].author.id).toBe(testUser.id);
    });

    it('should return empty list for user with no posts', async () => {
      // Create user with no posts
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('NoPostsPassword123!', 12);
      const userResult = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [`nopostsuser_${timestamp}`, `noposts_${timestamp}@example.com`, hashedPassword]
      );
      const emptyUser = userResult.rows[0];

      const response = await request(app)
        .get(`/api/v1/users/${emptyUser.id}/posts`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should handle invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-id/posts')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    it('should handle pagination for user posts', async () => {
      // Create multiple posts for the user
      await db.query(
        'INSERT INTO posts (author_id, content, latitude, longitude) VALUES ($1, $2, $3, $4)',
        [testUser.id, 'Second post by test user', 42.3601, -71.0589]
      );

      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}/posts?page=1&limit=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2
      });
    });
  });
}); 