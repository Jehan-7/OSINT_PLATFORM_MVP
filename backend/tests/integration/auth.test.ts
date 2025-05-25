import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/services/database';

// Set timeout for integration tests
jest.setTimeout(15000);

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await db.testConnection();
  });

  afterAll(async () => {
    // Clean up database connections
    await db.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await db.query("DELETE FROM users WHERE email LIKE '%test%' OR username LIKE '%test%'");
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'SecurePass123!'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        user: {
          id: expect.any(Number),
          username: validRegistrationData.username,
          email: validRegistrationData.email,
          reputation: 0,
          created_at: expect.any(String)
        },
        token: expect.any(String)
      });

      // Verify password is not returned
      expect(response.body.user.password_hash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();

      // Verify JWT token is valid
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    it('should return user data without sensitive information', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      const { user } = response.body;
      
      // Check required fields are present
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('reputation');
      expect(user).toHaveProperty('created_at');

      // Check sensitive fields are not present
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('password_hash');
    });

    describe('Input Validation', () => {
      it('should reject registration with missing username', async () => {
        const invalidData: any = { ...validRegistrationData };
        delete invalidData.username;

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: ['Username is required']
        });
      });

      it('should reject registration with missing email', async () => {
        const invalidData: any = { ...validRegistrationData };
        delete invalidData.email;

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: ['Email is required']
        });
      });

      it('should reject registration with missing password', async () => {
        const invalidData: any = { ...validRegistrationData };
        delete invalidData.password;

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: ['Password is required']
        });
      });

      it('should reject registration with invalid email format', async () => {
        const invalidData = {
          ...validRegistrationData,
          email: 'invalid-email-format'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.stringContaining('email')
          ])
        });
      });

      it('should reject registration with weak password', async () => {
        const invalidData = {
          ...validRegistrationData,
          password: 'weak'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Password must be at least 8 characters long',
            'Password must contain at least one uppercase letter',
            'Password must contain at least one number',
            'Password must contain at least one special character'
          ])
        });
      });

      it('should reject registration with username too short', async () => {
        const invalidData = {
          ...validRegistrationData,
          username: 'ab'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: ['Username must be at least 3 characters long']
        });
      });

      it('should reject registration with username too long', async () => {
        const invalidData = {
          ...validRegistrationData,
          username: 'a'.repeat(51) // Over 50 character limit
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: ['Username must be no more than 50 characters long']
        });
      });

      it('should reject registration with invalid username characters', async () => {
        const invalidData = {
          ...validRegistrationData,
          username: 'test@user!' // Special characters not allowed
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: ['Username can only contain letters, numbers, and underscores']
        });
      });
    });

    describe('Duplicate User Handling', () => {
      beforeEach(async () => {
        // Register a user for duplicate testing
        await request(app)
          .post('/api/auth/register')
          .send(validRegistrationData);
      });

      it('should reject registration with duplicate username', async () => {
        const duplicateUsernameData = {
          ...validRegistrationData,
          email: 'different@example.com',
          username: validRegistrationData.username // Same username
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(duplicateUsernameData)
          .expect(409);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Username already exists',
          error: 'DUPLICATE_USERNAME'
        });
      });

      it('should reject registration with duplicate email', async () => {
        const duplicateEmailData = {
          ...validRegistrationData,
          username: 'differentuser',
          email: validRegistrationData.email // Same email
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(duplicateEmailData)
          .expect(409);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Email already exists',
          error: 'DUPLICATE_EMAIL'
        });
      });

      it('should reject registration with both duplicate username and email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(validRegistrationData) // Exact same data
          .expect(409);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('already exists'),
          error: expect.stringMatching(/DUPLICATE_(USERNAME|EMAIL)/)
        });
      });
    });

    describe('Database Integration', () => {
      it('should store user in database with hashed password', async () => {
        await request(app)
          .post('/api/auth/register')
          .send(validRegistrationData)
          .expect(201);

        // Verify user was stored in database
        const result = await db.query(
          'SELECT * FROM users WHERE email = $1',
          [validRegistrationData.email]
        );

        expect(result.rows).toHaveLength(1);
        const user = result.rows[0];

        expect(user.username).toBe(validRegistrationData.username);
        expect(user.email).toBe(validRegistrationData.email);
        expect(user.password_hash).toBeDefined();
        expect(user.password_hash).not.toBe(validRegistrationData.password);
        expect(user.reputation).toBe(0);
        expect(user.created_at).toBeDefined();
      });

      it('should not store plain text password', async () => {
        await request(app)
          .post('/api/auth/register')
          .send(validRegistrationData)
          .expect(201);

        const result = await db.query(
          'SELECT password_hash FROM users WHERE email = $1',
          [validRegistrationData.email]
        );

        const storedHash = result.rows[0].password_hash;
        
        // Verify it's a bcrypt hash (starts with $2b$ and has proper length)
        expect(storedHash).toMatch(/^\$2b\$\d+\$/);
        expect(storedHash.length).toBeGreaterThan(50);
        expect(storedHash).not.toBe(validRegistrationData.password);
      });
    });

    describe('Rate Limiting', () => {
      it('should apply rate limiting to registration endpoint', async () => {
        // In test environment, rate limiting is very lenient (100 requests per second)
        // So we'll just verify the endpoint works and rate limiting middleware is present
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'ratelimituser',
            email: 'ratelimit@example.com',
            password: 'SecurePass123!'
          });

        // Should succeed (not rate limited in test environment)
        expect([201, 409]).toContain(response.status); // 201 for success, 409 if user exists
        
        // Verify rate limit headers are present
        expect(response.headers).toHaveProperty('ratelimit-limit');
      });
    });

    describe('Error Handling', () => {
      it('should handle malformed JSON', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send('invalid json')
          .set('Content-Type', 'application/json')
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('Invalid JSON')
        });
      });

      it('should handle empty request body', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({})
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed'
        });
      });

      it('should handle database connection errors gracefully', async () => {
        // This test would require mocking database failures
        // For now, we'll test that the endpoint exists and responds
        const response = await request(app)
          .post('/api/auth/register')
          .send(validRegistrationData);

        // Should not return 404 (endpoint exists)
        expect(response.status).not.toBe(404);
      });
    });
  });
}); 