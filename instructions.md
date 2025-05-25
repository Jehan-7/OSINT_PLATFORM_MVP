*   Defining a clear **Sprint Goal** for each.
*   Listing **User Stories & Acceptance Criteria** in the detailed "Given-When-Then" format.
*   Providing example **Tests Required** in a JavaScript/Jest/Supertest-like syntax, tailored to the features of each sprint in Plan G.
*   Detailing **Sprint Deliverables** including backend/frontend infrastructure, database schema changes, API enhancements, etc.

This will be a significant undertaking, as it means generating detailed test stubs and acceptance criteria for all 14 sprints. I will maintain the pragmatic scope of features from Plan G while adopting the detailed presentation style of Plan C.

Let's begin with Sprint 1.

---

**OSINT Platform - Pragmatic MVP Development Sprints (Rewritten in Style of Plan C)**

**Overall Approach:**
The following sprints detail a 7-month (14 two-week sprints) pragmatic development plan for the OSINT Platform MVP. Each sprint follows Test-Driven Development (TDD) principles where appropriate, focusing on delivering functional increments. While adopting the detailed style of "Plan C," the scope of features per sprint aligns with the more realistic "Plan G."

---

## Sprint 1: Backend Foundation & User Authentication API (Weeks 1-2)

### Sprint Goal
Establish a foundational, Dockerized backend server with a PostgreSQL database. Implement secure user registration and login API endpoints using simple JWT authentication, allowing users to create accounts and receive authentication tokens stored in localStorage for MVP.

---

### User Stories & Acceptance Criteria

#### US-G001: Development Environment Setup
**As a developer, I want a basic Dockerized development environment so that I can start building backend features efficiently.**

**Acceptance Criteria:**
- [ ] Docker Compose runs PostgreSQL and a Node.js/Express application container.
- [ ] The Node.js application connects successfully to the PostgreSQL database.
- [ ] Basic hot-reloading for the backend application is functional.
- [ ] Environment variables for database connection and JWT secret are configured.
- [ ] A `users` table is created in the database on startup if it doesn't exist (via initial migration or ORM sync).

**Tests Required:**
```javascript
// test/setup.test.js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // Assuming DATABASE_URL is set

describe('Development Environment', () => {
  test('PostgreSQL connection is established', async () => {
    const client = await pool.connect();
    expect(client).toBeDefined();
    const result = await client.query('SELECT NOW()');
    expect(result.rows).toHaveLength(1);
    client.release();
  });

  test('Users table exists in the database', async () => {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].table_name).toBe('users');
    client.release();
  });

  test('Essential environment variables are loaded', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.NODE_ENV).toBe('development'); // Or 'test' if running tests
  });
});
```

#### US-G002: New User Registration API
**As a new visitor, I want to register for an account using my username, email, and password via an API, so that I can access the platform's features.**

**Acceptance Criteria:**
- [ ] API endpoint `POST /api/auth/register` accepts `username`, `email`, and `password`.
- [ ] Username must be unique.
- [ ] Email must be a valid format and unique.
- [ ] Password must meet basic complexity (e.g., min 8 characters).
- [ ] Password is securely hashed using bcrypt before storing.
- [ ] Successful registration returns a 201 status with user data (excluding password hash) and a JWT.
- [ ] Registration fails with a 400/409 error if username or email is already taken.
- [ ] Registration fails with a 400 error for invalid email format or weak password.
- [ ] Basic input validation is performed for all fields.

**Tests Required:**
```javascript
// test/auth/register.api.test.js
const request = require('supertest');
const app = require('../src/app'); // Assuming your Express app instance
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bcrypt = require('bcrypt');

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    // Clear users table before each test
    await pool.query('TRUNCATE TABLE users CASCADE');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('successfully registers a valid user and returns user data and token', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    };
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.user).toMatchObject({
      username: 'testuser',
      email: 'test@example.com',
      reputation: 0
    });
    expect(response.body.user.id).toBeDefined();
    expect(response.body.user.password_hash).toBeUndefined();
    expect(response.body.token).toBeDefined();

    // Verify user in DB and password hashed
    const dbUser = await pool.query('SELECT * FROM users WHERE email = $1', [userData.email]);
    expect(dbUser.rows).toHaveLength(1);
    expect(dbUser.rows[0].username).toBe(userData.username);
    const isPasswordCorrect = await bcrypt.compare(userData.password, dbUser.rows[0].password_hash);
    expect(isPasswordCorrect).toBe(true);
  });

  test('rejects registration with a duplicate username', async () => {
    const userData = { username: 'testuser', email: 'test1@example.com', password: 'Password123' };
    await request(app).post('/api/auth/register').send(userData); // First user

    const duplicateUserData = { username: 'testuser', email: 'test2@example.com', password: 'Password123' };
    const response = await request(app)
      .post('/api/auth/register')
      .send(duplicateUserData)
      .expect(409); // Conflict

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('Username already exists');
  });

  test('rejects registration with a duplicate email', async () => {
    const userData = { username: 'user1', email: 'test@example.com', password: 'Password123' };
    await request(app).post('/api/auth/register').send(userData); // First user

    const duplicateEmailData = { username: 'user2', email: 'test@example.com', password: 'Password123' };
    const response = await request(app)
      .post('/api/auth/register')
      .send(duplicateEmailData)
      .expect(409); // Conflict

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('Email already exists');
  });

  test('rejects registration with an invalid email format', async () => {
    const userData = { username: 'testuser', email: 'invalid-email', password: 'Password123' };
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('Invalid email format');
  });

  test('rejects registration with a weak password (too short)', async () => {
    const userData = { username: 'testuser', email: 'test@example.com', password: 'short' };
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('Password must be at least 8 characters');
  });

  test('rejects registration if username is missing', async () => {
    const userData = { email: 'test@example.com', password: 'Password123' };
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400);
    expect(response.body.error.message).toContain('Username is required');
  });
});
```

#### US-G003: Existing User Login API
**As an existing user, I want to log in using my email and password via an API, so that I can access my account and platform features.**

**Acceptance Criteria:**
- [ ] API endpoint `POST /api/auth/login` accepts `email` and `password`.
- [ ] Validates user credentials against stored hashed passwords.
- [ ] Successful login returns a 200 status with user data (excluding password hash) and a JWT.
- [ ] Login fails with a 401 error for incorrect email/password or non-existent user.
- [ ] JWT includes `userId` and `username` in its payload and has a reasonable expiration time (e.g., 7 days for MVP).

**Tests Required:**
```javascript
// test/auth/login.api.test.js
const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('POST /api/auth/login', () => {
  let testUser;

  beforeAll(async () => {
    // Clear and seed a test user
    await pool.query('TRUNCATE TABLE users CASCADE');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const res = await pool.query(
      'INSERT INTO users (username, email, password_hash, reputation, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['loginuser', 'login@example.com', hashedPassword, 0, new Date()]
    );
    testUser = res.rows[0];
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE users CASCADE');
    await pool.end();
  });

  test('successfully logs in an existing user and returns user data and token', async () => {
    const loginData = {
      email: 'login@example.com',
      password: 'Password123'
    };
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user).toMatchObject({
      id: testUser.id,
      username: 'loginuser',
      email: 'login@example.com',
      reputation: 0
    });
    expect(response.body.user.password_hash).toBeUndefined();
    expect(response.body.token).toBeDefined();

    // Verify JWT payload
    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(testUser.id);
    expect(decoded.username).toBe('loginuser');
    expect(decoded.exp - decoded.iat).toBeGreaterThan(0); // Basic check for expiration
  });

  test('rejects login with incorrect password', async () => {
    const loginData = {
      email: 'login@example.com',
      password: 'WrongPassword'
    };
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  test('rejects login for a non-existent email', async () => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'Password123'
    };
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  test('rejects login if email is missing', async () => {
    const loginData = { password: 'Password123' };
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(400);
    expect(response.body.error.message).toContain('Email is required');
  });

  test('rejects login if password is missing', async () => {
    const loginData = { email: 'login@example.com' };
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(400);
    expect(response.body.error.message).toContain('Password is required');
  });
});
```

---

### Sprint 1 Deliverables

**Backend Infrastructure:**
- [ ] Dockerized development environment (Node.js/Express, PostgreSQL).
- [ ] Basic Express.js application structure with TypeScript.
- [ ] Environment variable configuration (`.env` for development).
- [ ] Basic centralized error handling middleware.

**Database Schema:**
```sql
-- Minimal users table for Sprint 1
CREATE TABLE users (
    id SERIAL PRIMARY KEY, -- Using SERIAL for pragmatic MVP, can switch to UUID later
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- [ ] Indexes on `users.username` and `users.email` for efficient lookups.

**Authentication Logic:**
- [ ] User Registration API endpoint (`POST /api/auth/register`).
- [ ] User Login API endpoint (`POST /api/auth/login`).
- [ ] Password hashing using `bcrypt` (salt rounds >= 10).
- [ ] JWT generation service creating tokens with `userId` and `username`.
- [ ] JWT validation logic for protected routes (to be used in future sprints).
- [ ] Basic input validation (e.g., Joi or express-validator) for registration and login fields.

**Testing:**
- [ ] Unit tests for password hashing and JWT services.
- [ ] Integration tests for `/api/auth/register` and `/api/auth/login` endpoints covering success and failure cases.
- [ ] Basic environment setup tests (DB connection).

**Documentation:**
- [ ] Updated README with setup instructions for the backend.
- [ ] Initial API documentation (e.g., Postman collection or simple Markdown) for auth endpoints.

---

This completes the detailed plan for Sprint 1 in the style of Plan C, while adhering to the pragmatic scope of Plan G. I will proceed with Sprint 2.

---

## Sprint 2: Core Post Functionality & Basic API Structure (Weeks 3-4)

### Sprint Goal
Develop backend API endpoints for creating posts with content and location (latitude/longitude), and retrieving lists of posts or individual posts. Ensure posts are stored in the database with their associated author and location, and implement basic geospatial indexing.

---

### User Stories & Acceptance Criteria

#### US-G004: Create a Geotagged Post (API)
**As an authenticated user, I want to create a post with textual content and associate it with a specific geographic location (latitude and longitude) via an API, so that I can share intelligence linked to a real-world place.**

**Acceptance Criteria:**
- [ ] API endpoint `POST /api/posts` accepts `content`, `latitude`, `longitude`, and optionally `location_name`.
- [ ] The endpoint requires JWT authentication; unauthenticated requests return 401.
- [ ] `content` is required and has a maximum length (e.g., 2000 characters).
- [ ] `latitude` and `longitude` are required and validated to be within their correct ranges.
- [ ] `location_name` is optional and sanitized if provided.
- [ ] Successful post creation returns a 201 status with the full created post data, including `author_id` (from authenticated user) and `created_at` timestamp.
- [ ] Posts are stored in a `posts` table with correct `author_id` linkage.
- [ ] Fails with 400 error for missing required fields or invalid data.

**Tests Required:**
```javascript
// test/posts/create.api.test.js
const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { generateTokenForUser } = require('../src/utils/testHelpers'); // Helper to generate JWT

describe('POST /api/posts', () => {
  let testUser, authToken;

  beforeAll(async () => {
    // Clear tables
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    // Seed a test user
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const res = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      ['postuser', 'postuser@example.com', hashedPassword]
    );
    testUser = res.rows[0];
    authToken = generateTokenForUser(testUser); // Generate a valid JWT
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    await pool.end();
  });

  test('successfully creates a new post for an authenticated user', async () => {
    const postData = {
      content: 'Incident reported at central park.',
      latitude: 40.7829,
      longitude: -73.9654,
      location_name: 'Central Park, NYC'
    };
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.post).toMatchObject({
      content: postData.content,
      latitude: postData.latitude,
      longitude: postData.longitude,
      location_name: postData.location_name,
      author_id: testUser.id,
      upvotes: 0,
      downvotes: 0
    });
    expect(response.body.post.id).toBeDefined();
    expect(response.body.post.created_at).toBeDefined();

    // Verify in DB
    const dbPost = await pool.query('SELECT * FROM posts WHERE id = $1', [response.body.post.id]);
    expect(dbPost.rows).toHaveLength(1);
    expect(dbPost.rows[0].author_id).toBe(testUser.id);
  });

  test('rejects post creation if not authenticated', async () => {
    const postData = { content: 'Test', latitude: 0, longitude: 0 };
    await request(app)
      .post('/api/posts')
      .send(postData)
      .expect(401);
  });

  test('rejects post creation with missing content', async () => {
    const postData = { latitude: 0, longitude: 0 };
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(400);
  });

  test('rejects post creation with invalid latitude', async () => {
    const postData = { content: 'Test', latitude: 91, longitude: 0 };
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(400);
  });

  test('rejects post creation with content exceeding max length', async () => {
    const postData = {
      content: 'a'.repeat(2001),
      latitude: 40.7829,
      longitude: -73.9654,
    };
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(400);
  });
});
```

#### US-G005: View All Posts API (Basic List)
**As a user (authenticated or not), I want to see a list of all created posts via an API, so that I can get an overview of shared intelligence.**

**Acceptance Criteria:**
- [ ] API endpoint `GET /api/posts` is publicly accessible.
- [ ] Returns a list of posts, potentially with basic pagination (e.g., `limit`, `offset` query parameters).
- [ ] Each post in the list includes `id`, `content`, `author_id` (or basic author info like username), `latitude`, `longitude`, `location_name`, `upvotes`, `downvotes`, `created_at`.
- [ ] Posts are ordered, e.g., by `created_at` in descending order by default.
- [ ] Returns an empty list if no posts exist.

**Tests Required:**
```javascript
// test/posts/get_all.api.test.js
const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { generateTokenForUser } = require('../src/utils/testHelpers');

describe('GET /api/posts', () => {
  let user1, user2;

  beforeAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    const hashedPass = await bcrypt.hash('Password123', 10);
    let res = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *', ['user1', 'user1@example.com', hashedPass]);
    user1 = res.rows[0];
    res = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *', ['user2', 'user2@example.com', hashedPass]);
    user2 = res.rows[0];

    // Create some posts
    await pool.query('INSERT INTO posts (author_id, content, latitude, longitude, created_at) VALUES ($1, $2, $3, $4, $5)', [user1.id, 'Post 1 by user1', 10, 10, new Date(Date.now() - 10000)]);
    await pool.query('INSERT INTO posts (author_id, content, latitude, longitude, created_at) VALUES ($1, $2, $3, $4, $5)', [user2.id, 'Post 2 by user2', 20, 20, new Date()]);
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    await pool.end();
  });

  test('retrieves a list of all posts, ordered by most recent', async () => {
    const response = await request(app)
      .get('/api/posts')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.posts).toBeInstanceOf(Array);
    expect(response.body.posts.length).toBe(2);
    expect(response.body.posts[0].content).toBe('Post 2 by user2'); // Most recent
    expect(response.body.posts[1].content).toBe('Post 1 by user1');

    response.body.posts.forEach(post => {
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('author_id'); // Or author object if joining
      expect(post).toHaveProperty('latitude');
      expect(post).toHaveProperty('longitude');
      expect(post).toHaveProperty('created_at');
    });
  });

  test('retrieves an empty list if no posts exist', async () => {
    await pool.query('TRUNCATE TABLE posts CASCADE'); // Clear posts
    const response = await request(app)
      .get('/api/posts')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.posts).toEqual([]);
  });

  test('supports basic pagination with limit and offset', async () => {
    // Re-add posts if cleared by previous test
    await pool.query('INSERT INTO posts (author_id, content, latitude, longitude, created_at) VALUES ($1, $2, $3, $4, $5)', [user1.id, 'Post 1 by user1', 10, 10, new Date(Date.now() - 10000)]);
    await pool.query('INSERT INTO posts (author_id, content, latitude, longitude, created_at) VALUES ($1, $2, $3, $4, $5)', [user2.id, 'Post 2 by user2', 20, 20, new Date()]);
    
    const response = await request(app)
      .get('/api/posts?limit=1&offset=0') // Get 1st post
      .expect(200);
      
    expect(response.body.posts.length).toBe(1);
    expect(response.body.posts[0].content).toBe('Post 2 by user2');

    const response2 = await request(app)
      .get('/api/posts?limit=1&offset=1') // Get 2nd post
      .expect(200);
    expect(response2.body.posts.length).toBe(1);
    expect(response2.body.posts[0].content).toBe('Post 1 by user1');
  });
});
```

#### US-G006: View a Specific Post's Details API
**As a user (authenticated or not), I want to view the detailed information of a single post via an API, so that I can understand a specific piece of intelligence thoroughly.**

**Acceptance Criteria:**
- [ ] API endpoint `GET /api/posts/:id` is publicly accessible.
- [ ] Returns the full post object for the given `id`, including `id`, `content`, `author_id` (or basic author info), `latitude`, `longitude`, `location_name`, `upvotes`, `downvotes`, `created_at`, `updated_at`.
- [ ] Returns a 404 error if no post with the given `id` exists.
- [ ] Returns a 400 error for an invalid ID format.

**Tests Required:**
```javascript
// test/posts/get_single.api.test.js
const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('GET /api/posts/:id', () => {
  let testUser, testPost;

  beforeAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    const hashedPass = await bcrypt.hash('Password123', 10);
    let res = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *', ['singlepostuser', 'single@example.com', hashedPass]);
    testUser = res.rows[0];
    
    res = await pool.query('INSERT INTO posts (author_id, content, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *', [testUser.id, 'Specific post content', 30, 30]);
    testPost = res.rows[0];
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    await pool.end();
  });

  test('retrieves a specific post by its ID', async () => {
    const response = await request(app)
      .get(`/api/posts/${testPost.id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.post).toMatchObject({
      id: testPost.id,
      content: 'Specific post content',
      author_id: testUser.id,
      latitude: 30,
      longitude: 30
    });
  });

  test('returns 404 for a non-existent post ID', async () => {
    const nonExistentId = testPost.id + 999; // Assuming this ID won't exist
    await request(app)
      .get(`/api/posts/${nonExistentId}`)
      .expect(404);
  });

  test('returns 400 for an invalid ID format (e.g., not a number if using SERIAL PK)', async () => {
    // If using UUID, this test would check for non-UUID format
    await request(app)
      .get('/api/posts/invalid-id-format')
      .expect(400); // Or specific error for UUID mismatch
  });
});
```

---

### Sprint 2 Deliverables

**Backend Infrastructure:**
- [ ] Authentication middleware refined for protecting post creation.
- [ ] Service layer logic for post creation and retrieval.

**Database Schema:**
```sql
-- posts table for Sprint 2
CREATE TABLE posts (
    id SERIAL PRIMARY KEY, -- Using SERIAL for pragmatic MVP
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 2000),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(255),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Add trigger for this later
);

-- Basic geospatial indexing (if not using PostGIS POINT yet)
-- For PostgreSQL, a B-tree index on lat/lng can help simple range queries.
-- True PostGIS indexing with GIST on a GEOMETRY column is preferred but deferred if too complex for this sprint.
CREATE INDEX idx_posts_location_simple ON posts (latitude, longitude);
CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_created_at_desc ON posts (created_at DESC);

-- Function to update `updated_at` column (basic)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER posts_updated_at_trigger
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```
- [ ] Foreign key `posts.author_id` referencing `users.id`.

**API Enhancements:**
- [ ] `POST /api/posts`: Create a new post (requires authentication).
- [ ] `GET /api/posts`: Retrieve a list of all posts (public).
- [ ] `GET /api/posts/:id`: Retrieve a single post by its ID (public).
- [ ] Input validation for post creation (`content`, `latitude`, `longitude`).

**Testing:**
- [ ] Unit tests for post service logic (creating, fetching posts).
- [ ] Integration tests for all new `/api/posts` endpoints.

**Documentation:**
- [ ] API documentation (e.g., Postman collection, Markdown) updated for new post endpoints.

---

This completes Sprint 2. Next up is Sprint 3, where we'll start building the basic frontend and connecting it to the authentication APIs.

---

## Sprint 3: Basic Frontend Setup & User Authentication UI (Weeks 5-6)

### Sprint Goal
Initialize the React frontend application with basic routing and styling. Implement UI for user registration and login, connecting these forms to the backend authentication APIs developed in Sprint 1. Successful authentication will store the JWT in localStorage and manage a basic authenticated state.

---

### User Stories & Acceptance Criteria

#### US-G007: Frontend Development Environment Setup
**As a frontend developer, I want a basic React project setup with TypeScript, Vite, and Tailwind CSS so that I can start building UI components and pages.**

**Acceptance Criteria:**
- [ ] React 18 application initialized using Vite with the TypeScript template.
- [ ] Tailwind CSS configured and basic styling applied to demonstrate setup.
- [ ] Basic project structure created (`components`, `pages`, `services`, `contexts`, `utils`).
- [ ] `react-router-dom` installed for client-side routing.
- [ ] ESLint and Prettier configured for code quality and formatting.
- [ ] Application runs locally with `npm run dev` and supports hot module replacement.

**Tests Required (Conceptual - UI tests are more involved):**
```javascript
// test/frontend/setup.test.tsx (Illustrative - actual testing might use RTL or Cypress)
// For this sprint, manual verification of setup might be more pragmatic than extensive UI unit tests.

describe('Frontend Environment', () => {
  test('Vite dev server starts successfully', () => {
    // This would be verified by running `npm run dev` and checking the output.
    // For an automated test, one might use a tool to check if the dev server responds.
    expect(true).toBe(true); // Placeholder for manual verification
  });

  test('Tailwind CSS classes apply correctly', () => {
    // Manual verification: Create a simple component with Tailwind classes, render it,
    // and inspect in the browser to ensure styles are applied.
    // e.g., <div className="bg-blue-500 text-white p-4">Hello Tailwind</div>
    expect(true).toBe(true); // Placeholder for manual verification
  });
});
```

#### US-G008: Frontend User Registration Page
**As a new visitor to the web application, I want to see a registration page with fields for username, email, and password, so that I can input my details to create an account.**

**Acceptance Criteria:**
- [ ] A `/register` route displays the registration page.
- [ ] The registration page contains a form with input fields for `username`, `email`, and `password`, and a "Register" submit button.
- [ ] Form input values are managed by component state.
- [ ] Submitting the form calls the backend `POST /api/auth/register` endpoint via a frontend API service.
- [ ] On successful registration (201 status from backend):
    - The received JWT is stored in `localStorage`.
    - The application's authentication state is updated (e.g., via Context).
    - The user is redirected to a designated page (e.g., login page or a basic home page).
- [ ] On registration failure (e.g., 400/409 from backend):
    - Backend error messages are displayed appropriately on the form.
    - `localStorage` and auth state are not modified.
- [ ] Basic client-side validation for field presence.

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/RegistrationPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext'; // Assuming AuthContext
import RegistrationPage from '../src/pages/RegistrationPage';
import LoginPage from '../src/pages/LoginPage'; // For redirection test
import * as authService from '../src/services/authService'; // Mock this

jest.mock('../src/services/authService'); // Mock the authService

const renderWithRouterAndAuth = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/register" element={ui} />
          <Route path="/login" element={<LoginPage />} /> {/* Mock or simple component */}
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('RegistrationPage', () => {
  const mockRegister = authService.registerUser as jest.Mock;

  beforeEach(() => {
    mockRegister.mockReset();
    localStorage.clear();
  });

  test('renders registration form with all fields', () => {
    renderWithRouterAndAuth(<RegistrationPage />, { route: '/register' });
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument(); // Exact match for password
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('allows typing in form fields', async () => {
    renderWithRouterAndAuth(<RegistrationPage />, { route: '/register' });
    await userEvent.type(screen.getByLabelText(/username/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'NewPassword123');

    expect(screen.getByLabelText(/username/i)).toHaveValue('newuser');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('new@example.com');
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('NewPassword123');
  });

  test('submits form data and handles successful registration', async () => {
    mockRegister.mockResolvedValueOnce({
      success: true,
      user: { id: 1, username: 'newuser', email: 'new@example.com', reputation: 0 },
      token: 'fake-jwt-token'
    });

    renderWithRouterAndAuth(<RegistrationPage />, { route: '/register' });

    await userEvent.type(screen.getByLabelText(/username/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'NewPassword123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@example.com', 'NewPassword123');
      expect(localStorage.getItem('authToken')).toBe('fake-jwt-token');
      // Add assertion for redirection, e.g., to login page or home
      // This depends on how redirection is handled (e.g., useNavigate hook)
      // For simplicity, check if login page content appears (if redirected there)
      // expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument(); // If redirected to login
    });
  });

  test('displays error message on registration failure (e.g., duplicate username)', async () => {
    mockRegister.mockRejectedValueOnce({
      response: {
        data: { success: false, error: { message: 'Username already exists' } }
      }
    });

    renderWithRouterAndAuth(<RegistrationPage />, { route: '/register' });
    await userEvent.type(screen.getByLabelText(/username/i), 'existinguser');
    await userEvent.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });
});
```

#### US-G009: Frontend User Login Page
**As an existing user visiting the web application, I want to see a login page with fields for email and password, so that I can enter my credentials to access my account.**

**Acceptance Criteria:**
- [ ] A `/login` route displays the login page.
- [ ] The login page contains a form with input fields for `email` and `password`, and a "Login" submit button.
- [ ] Form input values are managed by component state.
- [ ] Submitting the form calls the backend `POST /api/auth/login` endpoint via a frontend API service.
- [ ] On successful login (200 status from backend):
    - The received JWT is stored in `localStorage`.
    - The application's authentication state is updated.
    - The user is redirected to a protected area (e.g., a basic home page).
- [ ] On login failure (e.g., 401 from backend):
    - Backend error messages are displayed appropriately on the form.
    - `localStorage` and auth state are not modified.

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import LoginPage from '../src/pages/LoginPage';
import HomePage from '../src/pages/HomePage'; // For redirection test
import * as authService from '../src/services/authService';

jest.mock('../src/services/authService');

const renderWithRouterAndAuth = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={ui} />
          <Route path="/home" element={<HomePage />} /> {/* Mock or simple component */}
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('LoginPage', () => {
  const mockLogin = authService.loginUser as jest.Mock;

  beforeEach(() => {
    mockLogin.mockReset();
    localStorage.clear();
  });

  test('renders login form with all fields', () => {
    renderWithRouterAndAuth(<LoginPage />, { route: '/login' });
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('submits form data and handles successful login', async () => {
    mockLogin.mockResolvedValueOnce({
      success: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com', reputation: 0 },
      token: 'fake-jwt-token'
    });

    renderWithRouterAndAuth(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123');
      expect(localStorage.getItem('authToken')).toBe('fake-jwt-token');
      // Add assertion for redirection to home page
      // expect(screen.getByText(/welcome home/i)).toBeInTheDocument(); // If redirected to home
    });
  });

  test('displays error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce({
      response: {
        data: { success: false, error: { message: 'Invalid email or password' } }
      }
    });

    renderWithRouterAndAuth(<LoginPage />, { route: '/login' });
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });
});
```

#### US-G010: Basic Authenticated State Management
**As a frontend developer, I want a simple way to check if a user is currently authenticated (e.g., via React Context), so that I can conditionally render UI elements or redirect users in future sprints.**

**Acceptance Criteria:**
- [ ] An `AuthContext` (or similar mechanism) provides authentication status (`isAuthenticated`) and user data.
- [ ] On application load, the context attempts to initialize auth state from `localStorage`.
- [ ] The `login` function in the context updates state and `localStorage` upon successful API login.
- [ ] A `logout` function clears auth state and removes the token from `localStorage`.

**Tests Required (conceptual for Context - more for functions within):**
```javascript
// test/frontend/AuthContext.test.tsx
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'; // Assuming AuthContext structure

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const TestComponent = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  return (
    <>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? user.username : 'null'}</div>
      <button onClick={() => login({ user: { username: 'test', email: 'test@test.com', id: '1' }, token: 'testtoken' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initial state is not authenticated', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('login action updates isAuthenticated, user, and localStorage', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    act(() => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('test');
      expect(localStorage.getItem('authToken')).toBe('testtoken');
      // User data might also be stored, depending on implementation
    });
  });

  test('logout action clears isAuthenticated, user, and localStorage', async () => {
    // First login
    render(<AuthProvider><TestComponent /></AuthProvider>);
    act(() => {
      fireEvent.click(screen.getByText('Login'));
    });
    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('testtoken'));

    // Then logout
    act(() => {
      fireEvent.click(screen.getByText('Logout'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  test('initializes state from localStorage if token exists', () => {
    localStorage.setItem('authToken', 'existing-token');
    localStorage.setItem('authUser', JSON.stringify({ username: 'persistedUser', id: '2' })); // Example user data storage

    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    // This needs careful testing of the init logic within AuthProvider
    // For simplicity here, assume init logic works
    // expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    // expect(screen.getByTestId('user')).toHaveTextContent('persistedUser');
  });
});
```

---

### Sprint 3 Deliverables

**Frontend Application Setup:**
- [ ] React 18 + TypeScript + Vite project initialized.
- [ ] Tailwind CSS integrated for styling.
- [ ] Basic project folder structure (`components`, `pages`, `services`, `contexts`).
- [ ] `react-router-dom` for client-side routing with routes for `/`, `/login`, `/register`, `/home` (basic placeholder).

**Authentication UI & Logic:**
- [ ] Frontend Registration page (`/register`) with a form (username, email, password).
- [ ] Frontend Login page (`/login`) with a form (email, password).
- [ ] `authService.ts` module in the frontend for API calls to `/api/auth/register` and `/api/auth/login`.
- [ ] JWT from successful login/registration stored in `localStorage`.
- [ ] Basic `AuthContext` for managing `isAuthenticated` status and `user` object globally.
- [ ] Display of basic error messages from backend on registration/login forms.

**Testing:**
- [ ] Unit tests for frontend `authService` functions (mocking API calls).
- [ ] Component tests (React Testing Library) for Registration and Login form logic (input handling, submission).
- [ ] Basic tests for `AuthContext` actions (login, logout, initialization from localStorage).

**Documentation:**
- [ ] README updated with frontend setup instructions.

---

This completes Sprint 3. Next is Sprint 4, focusing on displaying posts from the backend and establishing a basic frontend layout.

---

## Sprint 4: Displaying Posts & Basic Frontend Layout (Weeks 7-8)

### Sprint Goal
Users (authenticated or not) can view a list of existing posts on a dedicated "Feed" page. Each post in the list should display its content, author (username), and creation date. A basic application shell (header, main content area) will be implemented.

---

### User Stories & Acceptance Criteria

#### US-G011: View Post Feed (Frontend)
**As a user, I want to navigate to a feed page and see a list of recently created posts, so that I can consume the intelligence shared by others.**

**Acceptance Criteria:**
- [ ] A `/feed` route displays the post feed page.
- [ ] On loading the Feed page, the application fetches a list of posts from the backend (`GET /api/posts`).
- [ ] Each post is rendered using a `PostCard` component.
- [ ] The `PostCard` component displays the post's content, the author's username, and the creation timestamp (formatted).
- [ ] Posts are displayed in reverse chronological order by default.
- [ ] A loading indicator is shown while posts are being fetched.
- [ ] If fetching posts fails, an appropriate error message is displayed.
- [ ] Posts data is managed using a global state solution (e.g., React Context + useReducer).

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/FeedPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { PostsProvider } from '../src/contexts/PostsContext'; // Assuming PostsContext
import FeedPage from '../src/pages/FeedPage';
import * as postsService from '../src/services/postsService'; // Mock this

jest.mock('../src/services/postsService');

const mockPosts = [
  { id: 1, content: 'Post 1 content', author: { username: 'user1' }, created_at: new Date().toISOString(), latitude: 0, longitude: 0, upvotes: 0, downvotes: 0 },
  { id: 2, content: 'Post 2 content', author: { username: 'user2' }, created_at: new Date(Date.now() - 100000).toISOString(), latitude: 0, longitude: 0, upvotes: 0, downvotes: 0 },
];

const renderWithProviders = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <AuthProvider>
      <PostsProvider> {/* Wrap with PostsProvider */}
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/feed" element={ui} />
          </Routes>
        </MemoryRouter>
      </PostsProvider>
    </AuthProvider>
  );
};

describe('FeedPage', () => {
  const mockFetchPosts = postsService.fetchPosts as jest.Mock;

  beforeEach(() => {
    mockFetchPosts.mockReset();
  });

  test('fetches and displays a list of posts', async () => {
    mockFetchPosts.mockResolvedValueOnce({ posts: mockPosts, pagination: { total: 2 } });
    renderWithProviders(<FeedPage />, { route: '/feed' });

    expect(screen.getByText(/loading posts.../i)).toBeInTheDocument(); // Check for loading state

    await waitFor(() => {
      expect(mockFetchPosts).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Post 1 content')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('Post 2 content')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
    });
    expect(screen.queryByText(/loading posts.../i)).not.toBeInTheDocument();
  });

  test('displays an error message if fetching posts fails', async () => {
    mockFetchPosts.mockRejectedValueOnce(new Error('Failed to fetch posts'));
    renderWithProviders(<FeedPage />, { route: '/feed' });

    await waitFor(() => {
      expect(screen.getByText(/failed to load posts. please try again later./i)).toBeInTheDocument();
    });
  });

  test('displays "No posts yet" if no posts are available', async () => {
    mockFetchPosts.mockResolvedValueOnce({ posts: [], pagination: { total: 0 } });
    renderWithProviders(<FeedPage />, { route: '/feed' });

    await waitFor(() => {
      expect(screen.getByText(/no posts yet. be the first to share some intelligence!/i)).toBeInTheDocument();
    });
  });
});

// test/frontend/PostCard.test.tsx
import { render, screen } from '@testing-library/react';
import PostCard from '../src/components/posts/PostCard'; // Assuming path
import { formatDistanceToNow } from 'date-fns';

describe('PostCard Component', () => {
  const post = {
    id: 1,
    content: 'This is a test post content.',
    author: { id: 1, username: 'testauthor', reputation: 10, email: '' }, // Add other required fields
    created_at: new Date().toISOString(),
    latitude: 40.7128,
    longitude: -74.0060,
    location_name: 'New York',
    upvotes: 5,
    downvotes: 1,
    comments_count: 3,
    notes_count: 1,
    verification_status: 'verified',
    user_vote: 1,
    media: [],
    tags: ['test', 'osint'],
  };

  test('renders post content, author, and formatted timestamp', () => {
    render(<PostCard post={post} />);
    expect(screen.getByText('This is a test post content.')).toBeInTheDocument();
    expect(screen.getByText('testauthor')).toBeInTheDocument();
    const expectedTime = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    expect(screen.getByText(expectedTime)).toBeInTheDocument(); // Or more robust time check
  });
});
```

#### US-G012: Basic Application Navigation Structure (Frontend)
**As a user, I want to see a consistent header or navigation bar across different pages, so that I can easily understand where I am and navigate the application.**

**Acceptance Criteria:**
- [ ] A `Header` component is created and displayed on all main pages (Login, Register, Feed).
- [ ] The `Header` component displays the application name/logo.
- [ ] Main page content is rendered within a `Layout` component that includes the `Header`.
- [ ] Basic navigation links (e.g., to Home/Feed, Login/Register conditionally based on auth state) are present in the header.

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/Header.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import Header from '../src/components/layout/Header'; // Assuming path

// Mock useAuth
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'), // Import and retain default behavior
  useAuth: jest.fn(),
}));

describe('Header Component', () => {
  test('displays application name/logo', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    render(<MemoryRouter><AuthProvider><Header /></AuthProvider></MemoryRouter>);
    expect(screen.getByText(/osint platform/i)).toBeInTheDocument(); // Or logo alt text
  });

  test('displays Login and Register links when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    render(<MemoryRouter><AuthProvider><Header /></AuthProvider></MemoryRouter>);
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  test('displays Feed link and Logout button when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isAuthenticated: true, 
      user: { username: 'authedUser' },
      logout: jest.fn() 
    });
    render(<MemoryRouter><AuthProvider><Header /></AuthProvider></MemoryRouter>);
    expect(screen.getByRole('link', { name: /feed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText(/authedUser/i)).toBeInTheDocument(); // Display username
  });
});
```

---

### Sprint 4 Deliverables

**Frontend API Services:**
- [ ] `postsService.ts` module created/extended to include:
    - `fetchPosts()` function for `GET /api/posts`.
    - `fetchPostById(id)` function for `GET /api/posts/:id`.

**Frontend Components:**
- [ ] `FeedPage.tsx` component that fetches and lists posts.
- [ ] `PostCard.tsx` component for displaying individual post summaries (content, author username, formatted creation date).
- [ ] Basic `Layout.tsx` component that includes a header and a main content area.
- [ ] `Header.tsx` component displaying application title and basic conditional navigation links (Login/Register or Feed/Logout).

**Routing & State Management:**
- [ ] `/feed` route added, rendering the `FeedPage`.
- [ ] `PostsContext.tsx` (or similar global state for posts) implemented to store fetched posts, loading status, and error status.
- [ ] `AuthProvider` (from Sprint 3) integrated into `Header` to show conditional links.

**UI/UX:**
- [ ] Basic loading state indicator (e.g., "Loading posts...") on the Feed page.
- [ ] Basic error display (e.g., "Failed to load posts.") on the Feed page.
- [ ] Posts on the feed are displayed in a readable list format.

**Testing:**
- [ ] Unit tests for `postsService` functions (mocking API calls).
- [ ] Component tests (React Testing Library) for `PostCard` and `Header`.
- [ ] Integration-style component tests for `FeedPage` (mocking the service layer) to verify data display, loading, and error states.

**Documentation:**
- [ ] Brief notes on new frontend components and their props.

---

This completes Sprint 4. We now have a frontend that can display posts fetched from the backend. Sprint 5 will focus on integrating the 2D map for post visualization and enabling post creation from the frontend.

---

## Sprint 5: Map Visualization (2D) & Frontend Post Creation (Weeks 9-10)

### Sprint Goal
Authenticated users can create new posts with content and a selected location via a frontend form. All users can view posts plotted as markers on an interactive 2D map using React-Leaflet.

---

### User Stories & Acceptance Criteria

#### US-G013: View Posts on a 2D Map (Frontend)
**As a user, I want to see posts visualized as markers on an interactive 2D map, so that I can understand the geographic distribution and context of intelligence.**

**Acceptance Criteria:**
- [ ] A `/map` route displays the map view page.
- [ ] The application fetches posts with geographic coordinates from the backend (`GET /api/posts` or a dedicated geo-query endpoint).
- [ ] `react-leaflet` is integrated to display an OpenStreetMap (or similar) base layer.
- [ ] Each post with valid coordinates is displayed as a marker at its respective location on the 2D map.
- [ ] Users can pan and zoom the map.
- [ ] Clicking on a post marker displays a `Popup` with a summary of the post (e.g., content snippet, author).
- [ ] A loading state is shown while map/posts data is being fetched.
- [ ] Errors during data fetching are handled and displayed.

**Tests Required (using React Testing Library, mocking Leaflet):**
```javascript
// test/frontend/MapViewPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { PostsProvider } from '../src/contexts/PostsContext';
import MapViewPage from '../src/pages/MapViewPage';
import * as postsService from '../src/services/postsService';

jest.mock('../src/services/postsService');

// Minimal mock for React-Leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom }) => (
    <div data-testid="map-container" data-center={center.join(',')} data-zoom={zoom}>
      {children}
    </div>
  ),
  TileLayer: ({ url }) => <div data-testid="tile-layer" data-url={url} />,
  Marker: ({ position, children }) => (
    <div data-testid={`marker-${position.join(',')}`} data-lat={position[0]} data-lng={position[1]}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup-content">{children}</div>,
}));

const mockGeoPosts = [
  { id: 1, content: 'Event at Times Square', author: { username: 'reporterNY' }, created_at: new Date().toISOString(), latitude: 40.7580, longitude: -73.9855, location_name: 'Times Square' },
  { id: 2, content: 'Incident near Eiffel Tower', author: { username: 'reporterParis' }, created_at: new Date().toISOString(), latitude: 48.8584, longitude: 2.2945, location_name: 'Eiffel Tower' },
];

describe('MapViewPage', () => {
  const mockFetchPosts = postsService.fetchPosts as jest.Mock; // Or a specific geo-fetch

  beforeEach(() => {
    mockFetchPosts.mockReset();
  });

  test('renders map and displays post markers', async () => {
    mockFetchPosts.mockResolvedValueOnce({ posts: mockGeoPosts, pagination: { total: 2 } });
    render(
      <AuthProvider>
        <PostsProvider>
          <MemoryRouter initialEntries={['/map']}>
            <Routes><Route path="/map" element={<MapViewPage />} /></Routes>
          </MemoryRouter>
        </PostsProvider>
      </AuthProvider>
    );

    expect(screen.getByText(/loading map data.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
      expect(screen.getByTestId(`marker-${mockGeoPosts[0].latitude},${mockGeoPosts[0].longitude}`)).toBeInTheDocument();
      expect(screen.getByTestId(`marker-${mockGeoPosts[1].latitude},${mockGeoPosts[1].longitude}`)).toBeInTheDocument();
    });
  });

  test('displays post info in popup when marker is clicked (conceptual)', async () => {
    mockFetchPosts.mockResolvedValueOnce({ posts: [mockGeoPosts[0]], pagination: { total: 1 } });
     render(
      <AuthProvider>
        <PostsProvider>
          <MemoryRouter initialEntries={['/map']}>
            <Routes><Route path="/map" element={<MapViewPage />} /></Routes>
          </MemoryRouter>
        </PostsProvider>
      </AuthProvider>
    );

    await waitFor(() => screen.getByTestId(`marker-${mockGeoPosts[0].latitude},${mockGeoPosts[0].longitude}`));
    
    // Simulating click - actual implementation would require more setup for Leaflet popups
    // For this test, we'd typically check if a child component responsible for popup appears
    // or if a state controlling popup visibility changes.
    // fireEvent.click(screen.getByTestId(`marker-${mockGeoPosts[0].latitude},${mockGeoPosts[0].longitude}`));
    // await waitFor(() => {
    //   expect(screen.getByTestId('popup-content')).toHaveTextContent('Event at Times Square');
    // });
    // This part is complex to test without a full Leaflet environment or more sophisticated mocks.
    // Focus on ensuring markers are rendered for now.
  });
});
```

#### US-G014: Create a Post from Frontend with Map Location Picker
**As an authenticated user, I want to access a form to create a new post, including a field for text content and an interactive map to select the post's location, so that I can easily and accurately geotag my intelligence.**

**Acceptance Criteria:**
- [ ] A `/create-post` route (or modal) is accessible to authenticated users.
- [ ] The form includes a textarea for `content` and an interactive 2D map (Leaflet) for location selection.
- [ ] Clicking on the map places a marker and updates the form's latitude/longitude state.
- [ ] The selected coordinates are displayed numerically.
- [ ] Users can optionally input a `location_name`.
- [ ] Submitting the form calls the backend `POST /api/posts` endpoint with `content`, `latitude`, `longitude`, and `location_name`.
- [ ] Upon successful creation (201 status from backend):
    - A success message is displayed.
    - The form is cleared.
    - The new post is ideally added to the client-side post state (for immediate display on Feed/Map).
- [ ] On creation failure (e.g., 400/401 from backend):
    - Backend error messages are displayed on the form.
- [ ] Basic client-side validation for content presence and valid location selection.
- [ ] Unauthenticated users are redirected or cannot access the creation form.

**Tests Required (using React Testing Library, mocking Leaflet for picker):**
```javascript
// test/frontend/CreatePostPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { PostsProvider } from '../src/contexts/PostsContext';
import CreatePostPage from '../src/pages/CreatePostPage';
import * as postsService from '../src/services/postsService';

jest.mock('../src/services/postsService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'),
  useAuth: jest.fn(),
}));


// Mock LocationPicker - actual map interaction is hard to test here
jest.mock('../src/components/posts/LocationPicker', () => ({
  __esModule: true,
  default: ({ onLocationSelect }) => (
    <div data-testid="location-picker">
      <button onClick={() => onLocationSelect({ lat: 10, lng: 20 })}>Simulate Map Click</button>
    </div>
  ),
}));


describe('CreatePostPage', () => {
  const mockCreatePost = postsService.createPost as jest.Mock;
  const mockNavigate = useNavigate as jest.Mock;
  
  beforeEach(() => {
    mockCreatePost.mockReset();
    mockNavigate.mockReset();
    (useAuth as jest.Mock).mockReturnValue({ 
      isAuthenticated: true, 
      user: { id: 1, username: 'creator' } 
    });
  });

  const renderPage = () => render(
    <AuthProvider>
      <PostsProvider>
        <MemoryRouter initialEntries={['/create-post']}>
          <Routes><Route path="/create-post" element={<CreatePostPage />} /></Routes>
        </MemoryRouter>
      </PostsProvider>
    </AuthProvider>
  );

  test('renders create post form with content and location picker', () => {
    renderPage();
    expect(screen.getByLabelText(/your intelligence report/i)).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();
    expect(screen.getByLabelText(/location name \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit post/i })).toBeInTheDocument();
  });

  test('allows content input and location selection', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/your intelligence report/i), 'New event details.');
    expect(screen.getByLabelText(/your intelligence report/i)).toHaveValue('New event details.');

    // Simulate location selection from mocked picker
    fireEvent.click(screen.getByText('Simulate Map Click'));
    await waitFor(() => {
      // Check if lat/lng display fields are updated (assuming they exist)
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // For latitude
      expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // For longitude
    });
  });

  test('submits form data and handles successful post creation', async () => {
    mockCreatePost.mockResolvedValueOnce({ 
      success: true, 
      post: { id: 3, content: 'New event details.' /* ...other post fields */ }
    });
    renderPage();

    await userEvent.type(screen.getByLabelText(/your intelligence report/i), 'New event details.');
    fireEvent.click(screen.getByText('Simulate Map Click')); // Selects lat: 10, lng: 20
    await userEvent.type(screen.getByLabelText(/location name \(optional\)/i), 'Test Location');
    
    await userEvent.click(screen.getByRole('button', { name: /submit post/i }));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith({
        content: 'New event details.',
        latitude: 10,
        longitude: 20,
        location_name: 'Test Location'
      });
      expect(screen.getByText(/post created successfully!/i)).toBeInTheDocument();
      // Optionally check if form fields are cleared or user is navigated
      // expect(mockNavigate).toHaveBeenCalledWith('/feed'); // Example navigation
    });
  });

  test('displays error message on post creation failure', async () => {
    mockCreatePost.mockRejectedValueOnce({
      response: { data: { success: false, error: { message: 'Content too short' } } }
    });
    renderPage();
    // Fill and submit form (as above)
    await userEvent.type(screen.getByLabelText(/your intelligence report/i), 'Short');
    fireEvent.click(screen.getByText('Simulate Map Click'));
    await userEvent.click(screen.getByRole('button', { name: /submit post/i }));

    await waitFor(() => {
      expect(screen.getByText(/content too short/i)).toBeInTheDocument();
    });
  });

  test('requires content before submission', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Simulate Map Click')); // Select location
    await userEvent.click(screen.getByRole('button', { name: /submit post/i })); // Submit with no content

    await waitFor(() => {
      // Assuming client-side validation or backend error display
      expect(screen.getByText(/content is required/i)).toBeInTheDocument(); 
    });
  });

  test('redirects unauthenticated users', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    mockNavigate.mockImplementation(() => {}); // Mock actual navigation
    
    renderPage();
    
    // Check if navigate was called to redirect, e.g. to '/login'
    // This depends on ProtectedRoute implementation details
    // For now, we assume a ProtectedRoute component handles this.
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.anything());
  });
});
```

---

### Sprint 5 Deliverables

**Frontend API Services:**
- [ ] `postsService.ts` extended with `createPost(postData)` function for `POST /api/posts`.

**Frontend Components:**
- [ ] `MapViewPage.tsx` component integrating `react-leaflet` to display post markers.
- [ ] `LeafletMarker.tsx` (or similar) component for custom markers and popups (showing basic post info).
- [ ] `CreatePostPage.tsx` component with a form for post content and location.
- [ ] `LocationPicker.tsx` component (using Leaflet) for users to select coordinates on a map.
- [ ] Input fields for manual latitude/longitude entry (optional, as map picker is primary).

**Routing & State Management:**
- [ ] `/map` route added, rendering the `MapViewPage`.
- [ ] `/create-post` route (protected) added, rendering `CreatePostPage`.
- [ ] `PostsContext` updated to handle adding newly created posts to the local state for immediate UI update, or trigger a re-fetch.
- [ ] `AuthContext` used to protect the `/create-post` route.

**UI/UX:**
- [ ] Interactive 2D map on `/map` where posts are plotted.
- [ ] Clickable map markers display post summary popups.
- [ ] Post creation form includes map-based location selection.
- [ ] Clear success/error feedback for post creation.
- [ ] Basic client-side validation on the create post form (e.g., content not empty, location selected).

**Testing:**
- [ ] Unit tests for `LocationPicker` and `CreatePostForm` business logic.
- [ ] Component tests (React Testing Library) for `MapViewPage` verifying map and marker rendering (mocking Leaflet).
- [ ] Component tests for `CreatePostPage` verifying form submission flow and validation (mocking services).

**Documentation:**
- [ ] Notes on React-Leaflet integration and usage.
- [ ] Frontend API service documentation updated for `createPost`.

---

This completes Sprint 5. The core loop of creating and viewing geotagged posts on a 2D map is now functional on the frontend. Sprint 6 will focus on frontend post voting.

---

## Sprint 6: Frontend Post Voting & Basic User Profiles (Weeks 11-12)

### Sprint Goal
Authenticated users can upvote or downvote posts displayed in the feed or on the map. The vote counts on posts will update in the UI. A basic placeholder for user profile pages will be set up with routing.

---

### User Stories & Acceptance Criteria

#### US-G015: Vote on a Post (Frontend)
**As an authenticated user, I want to be able to upvote or downvote a post I see in the feed or on the map, so that I can express my opinion on its relevance or quality and help surface valuable content.**

**Acceptance Criteria:**
- [ ] Upvote and downvote buttons/icons are visible on each `PostCard` and within map marker `Popup`s.
- [ ] Current `upvotes` and `downvotes` counts are displayed for each post.
- [ ] Clicking the upvote/downvote button (when authenticated) sends a request to the backend (`POST /api/posts/:id/vote`).
- [ ] The UI optimistically updates the vote counts and button state upon clicking.
- [ ] If the backend call fails, the UI reverts the optimistic update and shows an error.
- [ ] If the user has already voted, the button reflects their current vote (e.g., highlighted upvote).
- [ ] Clicking an active vote button again removes that vote (sends vote: 0 to backend).
- [ ] Clicking the other vote button changes the vote (e.g., from upvote to downvote).
- [ ] Unauthenticated users are prompted to log in (or buttons are disabled/hidden).

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/VotingComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { PostsProvider, usePostsContext } from '../src/contexts/PostsContext'; // Assuming context for posts
import VotingComponent from '../src/components/posts/VotingComponent'; // A dedicated component or part of PostCard
import * as postsService from '../src/services/postsService';

jest.mock('../src/services/postsService');
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'),
  useAuth: jest.fn(),
}));
// Mock usePostsContext if VotingComponent uses it directly to dispatch updates
jest.mock('../src/contexts/PostsContext', () => {
  const originalModule = jest.requireActual('../src/contexts/PostsContext');
  return {
    ...originalModule,
    usePostsContext: jest.fn(),
  };
});


describe('VotingComponent', () => {
  const mockVoteOnPost = postsService.voteOnPost as jest.Mock;
  const mockDispatchPosts = jest.fn(); // Mock dispatch from PostsContext

  const initialPost = {
    id: 1,
    content: 'Test Post',
    author: { username: 'testauthor' },
    created_at: new Date().toISOString(),
    latitude: 0, longitude: 0,
    upvotes: 10,
    downvotes: 2,
    user_vote: null, // null, 1 (upvoted), or -1 (downvoted)
  };

  beforeEach(() => {
    mockVoteOnPost.mockReset();
    mockDispatchPosts.mockReset();
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: { id: 1 } });
    (usePostsContext as jest.Mock).mockReturnValue({ dispatchPosts: mockDispatchPosts }); // Mocking dispatchPosts
  });

  const renderComponent = (postProps = {}) => {
    const post = { ...initialPost, ...postProps };
    return render(
      <AuthProvider>
        <PostsProvider> {/* Ensure PostsProvider is wrapping */}
          <VotingComponent postId={post.id} initialUpvotes={post.upvotes} initialDownvotes={post.downvotes} initialUserVote={post.user_vote} />
        </PostsProvider>
      </AuthProvider>
    );
  };

  test('displays initial vote counts and buttons', () => {
    renderComponent();
    expect(screen.getByLabelText(/upvote post/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/downvote post/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Upvotes
    expect(screen.getByText('2')).toBeInTheDocument();  // Downvotes
  });

  test('handles successful upvote', async () => {
    mockVoteOnPost.mockResolvedValueOnce({ success: true, upvotes_count: 11, downvotes_count: 2, user_vote: 1 });
    renderComponent();

    await userEvent.click(screen.getByLabelText(/upvote post/i));

    // Optimistic UI update check (may need specific test IDs if counts are not immediately visible)
    await waitFor(() => {
      // Assuming VotingComponent internally updates its display or calls context
      // This test might need adjustment based on actual implementation of optimistic update
      // For now, we check if the service was called and context dispatch happened
      expect(mockVoteOnPost).toHaveBeenCalledWith(initialPost.id, 1);
      expect(mockDispatchPosts).toHaveBeenCalledWith({
        type: 'UPDATE_POST_VOTES',
        payload: { postId: initialPost.id, upvotes: 11, downvotes: 2, user_vote: 1 },
      });
    });
  });
  
  test('handles changing vote from upvote to downvote', async () => {
    // Initial state: user has upvoted
    mockVoteOnPost.mockResolvedValueOnce({ success: true, upvotes_count: 9, downvotes_count: 3, user_vote: -1 });
    renderComponent({ user_vote: 1, upvotes: 11 }); // Start as upvoted

    await userEvent.click(screen.getByLabelText(/downvote post/i));

    await waitFor(() => {
      expect(mockVoteOnPost).toHaveBeenCalledWith(initialPost.id, -1);
      expect(mockDispatchPosts).toHaveBeenCalledWith({
        type: 'UPDATE_POST_VOTES',
        payload: { postId: initialPost.id, upvotes: 9, downvotes: 3, user_vote: -1 },
      });
    });
  });

  test('handles removing an upvote', async () => {
    mockVoteOnPost.mockResolvedValueOnce({ success: true, upvotes_count: 10, downvotes_count: 2, user_vote: 0 });
    renderComponent({ user_vote: 1, upvotes: 11 }); // Start as upvoted

    await userEvent.click(screen.getByLabelText(/upvote post/i)); // Click again to remove

    await waitFor(() => {
      expect(mockVoteOnPost).toHaveBeenCalledWith(initialPost.id, 0);
      expect(mockDispatchPosts).toHaveBeenCalledWith({
        type: 'UPDATE_POST_VOTES',
        payload: { postId: initialPost.id, upvotes: 10, downvotes: 2, user_vote: 0 },
      });
    });
  });

  test('disables voting buttons if user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    renderComponent();
    expect(screen.getByLabelText(/upvote post/i)).toBeDisabled();
    expect(screen.getByLabelText(/downvote post/i)).toBeDisabled();
    // Optionally, check for a "Login to vote" message if implemented
  });

  test('reverts optimistic update and shows error on vote failure', async () => {
    mockVoteOnPost.mockRejectedValueOnce(new Error('API Error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error
    renderComponent();

    await userEvent.click(screen.getByLabelText(/upvote post/i));

    await waitFor(() => {
      // Check if UI reverted (e.g., counts back to initial, button state reset)
      // This requires the component to handle the error and revert.
      // For now, ensure dispatch was called for optimistic update then potentially for revert
      // or an error state is set.
      expect(screen.getByText('10')).toBeInTheDocument(); // Assuming it reverts
      expect(screen.getByText(/failed to cast vote/i)).toBeInTheDocument(); // Check for error message
    });
    consoleErrorSpy.mockRestore();
  });
});
```

#### US-G016: Basic User Profile Page Access (Frontend Stub)
**As a user, I want to be able to click on an author's username on a post, so that I can navigate to a page (even if basic for now) representing that user's profile.**

**Acceptance Criteria:**
- [ ] Author usernames displayed on `PostCard` components are clickable links.
- [ ] Clicking an author's username navigates to a URL like `/profile/:username` (or `/users/:username`).
- [ ] A basic `UserProfilePage.tsx` component is created for this route.
- [ ] The `UserProfilePage` displays, at a minimum, the username extracted from the route parameter.
- [ ] No actual user data fetching is required for this page in this sprint (it's a stub).

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/UserProfilePage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserProfilePage from '../src/pages/UserProfilePage'; // Assuming path
import PostCard from '../src/components/posts/PostCard';

describe('UserProfilePage Stub', () => {
  test('displays the username from the route parameter', () => {
    const username = 'profileUser';
    render(
      <MemoryRouter initialEntries={[`/profile/${username}`]}>
        <Routes>
          <Route path="/profile/:username" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
    // Assuming the UserProfilePage component simply displays the username for now
    expect(screen.getByText(new RegExp(username, "i"))).toBeInTheDocument(); 
    // Could be "Profile of profileUser" or similar.
  });
});

describe('PostCard Author Link', () => {
   const post = {
    id: 1,
    content: 'Post content.',
    author: { id: 1, username: 'author123', reputation: 10, email: '' }, // Add other required fields
    created_at: new Date().toISOString(),
    latitude: 0, longitude: 0, location_name: '',
    upvotes: 0, downvotes: 0, comments_count: 0, notes_count: 0,
    verification_status: 'unverified', user_vote: null, media: [], tags: []
  };

  test('author username in PostCard links to their profile page', () => {
    render(
        <MemoryRouter>
            <PostCard post={post} />
        </MemoryRouter>
    );
    const authorLink = screen.getByRole('link', { name: 'author123' });
    expect(authorLink).toBeInTheDocument();
    expect(authorLink).toHaveAttribute('href', '/profile/author123'); // Or /users/author123
  });
});
```

---

### Sprint 6 Deliverables

**Backend API (Pragmatic MVP assumption for voting):**
- [ ] `POST /api/posts/:id/vote` endpoint implemented or verified:
    - Accepts `vote_type` (e.g., 1 for upvote, -1 for downvote, 0 to remove).
    - Updates `upvotes` / `downvotes` count on the `posts` table.
    - Tracks individual user votes in a `votes` table (or similar) to prevent duplicates and allow vote changes.
    - Requires authentication.

**Frontend API Services:**
- [ ] `postsService.ts` extended with `voteOnPost(postId, voteValue)` function.

**Frontend Components:**
- [ ] `VotingComponent.tsx` (or similar integrated into `PostCard.tsx` and map popups) with upvote/downvote buttons and vote count display.
- [ ] `UserProfilePage.tsx` (basic stub) displaying the username from route params.

**Routing & State Management:**
- [ ] `/profile/:username` (or `/users/:username`) route added, rendering the `UserProfilePage` stub.
- [ ] `PostsContext` (or relevant state management) updated to handle optimistic UI updates for vote counts and user's vote status on a post.

**UI/UX:**
- [ ] Clickable author usernames on `PostCard`s linking to the stubbed profile page.
- [ ] Visual feedback on `VotingComponent` for current vote state and after a vote action.
- [ ] Disabled or hidden voting buttons for unauthenticated users.

**Testing:**
- [ ] Backend: Integration tests for the `POST /api/posts/:id/vote` endpoint.
- [ ] Frontend: Unit tests for `voteOnPost` service function.
- [ ] Frontend: Component tests (RTL) for `VotingComponent` covering different states and interactions.
- [ ] Frontend: Basic rendering test for the `UserProfilePage` stub.
- [ ] Frontend: Test ensuring author links in `PostCard` navigate correctly.

---

This completes Sprint 6. The platform now has basic social interaction via post voting. Sprint 7 will introduce frontend commenting.

---

## Sprint 7: Frontend Comments on Posts (Weeks 13-14)

### Sprint Goal
Users can view comments associated with a post, and authenticated users can add new comments via a frontend interface. Comments will be displayed beneath the post details.

---

### User Stories & Acceptance Criteria

#### US-G017: View Comments on a Post (Frontend)
**As a user, I want to see comments left by other users on a specific post, so that I can read discussions and additional perspectives related to the intelligence.**

**Acceptance Criteria:**
- [ ] When viewing a post's details (e.g., on a dedicated post page or an expanded view), a comment section is visible.
- [ ] The application fetches comments for the specific post from the backend (`GET /api/posts/:postId/comments`).
- [ ] Each comment is rendered using a `CommentCard` component.
- [ ] The `CommentCard` displays the commenter's username, the comment content, and the creation timestamp (formatted).
- [ ] Comments are displayed in chronological order.
- [ ] If there are no comments, a message like "No comments yet." is displayed.
- [ ] A loading indicator is shown while comments are being fetched.
- [ ] Errors during comment fetching are handled and displayed.

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/CommentList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CommentsProvider } from '../src/contexts/CommentsContext'; // Assuming CommentsContext
import CommentList from '../src/components/comments/CommentList'; // Path to CommentList
import * as commentsService from '../src/services/commentsService'; // Mock this

jest.mock('../src/services/commentsService');

const mockComments = [
  { id: 1, postId: 1, content: 'First insightful comment!', author: { username: 'commenter1' }, created_at: new Date().toISOString(), upvotes: 0, parent_id: null, replies_count: 0, user_vote: null },
  { id: 2, postId: 1, content: 'Another great point.', author: { username: 'commenter2' }, created_at: new Date(Date.now() - 50000).toISOString(), upvotes: 0, parent_id: null, replies_count: 0, user_vote: null },
];

const renderCommentList = (postId = 1) => {
  return render(
    <AuthProvider>
      <CommentsProvider postId={postId}> {/* Pass postId if context is per-post */}
        <MemoryRouter>
          <CommentList postId={postId} />
        </MemoryRouter>
      </CommentsProvider>
    </AuthProvider>
  );
};

describe('CommentList Component', () => {
  const mockFetchComments = commentsService.fetchCommentsByPostId as jest.Mock;

  beforeEach(() => {
    mockFetchComments.mockReset();
  });

  test('fetches and displays a list of comments for a post', async () => {
    mockFetchComments.mockResolvedValueOnce({ comments: mockComments, pagination: { total: 2 } });
    renderCommentList(1);

    // Initial loading state might be tricky to catch if fetch is too fast
    // expect(screen.getByText(/loading comments.../i)).toBeInTheDocument(); 

    await waitFor(() => {
      expect(mockFetchComments).toHaveBeenCalledWith(1, expect.any(Object)); // postId and pagination
      expect(screen.getByText('First insightful comment!')).toBeInTheDocument();
      expect(screen.getByText('commenter1')).toBeInTheDocument();
      expect(screen.getByText('Another great point.')).toBeInTheDocument();
      expect(screen.getByText('commenter2')).toBeInTheDocument();
    });
  });

  test('displays an error message if fetching comments fails', async () => {
    mockFetchComments.mockRejectedValueOnce(new Error('Failed to fetch comments'));
    renderCommentList(1);

    await waitFor(() => {
      expect(screen.getByText(/failed to load comments/i)).toBeInTheDocument();
    });
  });

  test('displays "No comments yet" if no comments are available', async () => {
    mockFetchComments.mockResolvedValueOnce({ comments: [], pagination: { total: 0 } });
    renderCommentList(1);

    await waitFor(() => {
      expect(screen.getByText(/no comments yet. start the conversation!/i)).toBeInTheDocument();
    });
  });
});

// test/frontend/CommentCard.test.tsx
import { render, screen } from '@testing-library/react';
import CommentCard from '../src/components/comments/CommentCard'; // Path to CommentCard
import { formatDistanceToNow } from 'date-fns';

describe('CommentCard Component', () => {
  const comment = {
    id: 1,
    postId: 1,
    content: 'This is a test comment.',
    author: { id: 1, username: 'testcommenter', reputation: 5, email: '' }, // Add other required fields
    created_at: new Date().toISOString(),
    upvotes: 3,
    parent_id: null,
    replies_count: 0,
    user_vote: null,
  };

  test('renders comment content, author, and formatted timestamp', () => {
    render(<MemoryRouter><CommentCard comment={comment} /></MemoryRouter>); // MemoryRouter if using <Link>
    expect(screen.getByText('This is a test comment.')).toBeInTheDocument();
    expect(screen.getByText('testcommenter')).toBeInTheDocument();
    const expectedTime = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });
});
```

#### US-G018: Add a Comment to a Post (Frontend)
**As an authenticated user, I want to be able to add my own textual comment to a post, so that I can contribute to the discussion, ask questions, or provide my own insights.**

**Acceptance Criteria:**
- [ ] A `CommentForm` component is displayed below the post content (or comment list) if the user is authenticated.
- [ ] The `CommentForm` includes a textarea for comment content and a "Submit Comment" button.
- [ ] Submitting the form calls the backend `POST /api/posts/:postId/comments` endpoint with the content.
- [ ] Upon successful comment submission (201 status from backend):
    - The new comment is optimistically added to the displayed comment list.
    - The comment form textarea is cleared.
    - A success message might be briefly shown.
- [ ] On submission failure (e.g., 400/401 from backend):
    - Backend error messages are displayed on the form.
- [ ] Attempting to submit an empty comment shows a client-side validation error.
- [ ] Unauthenticated users do not see the comment form or it is disabled.

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/CommentForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { CommentsProvider, useCommentsContext } from '../src/contexts/CommentsContext';
import CommentForm from '../src/components/comments/CommentForm';
import * as commentsService from '../src/services/commentsService';

jest.mock('../src/services/commentsService');
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'),
  useAuth: jest.fn(),
}));
jest.mock('../src/contexts/CommentsContext', () => ({
  ...jest.requireActual('../src/contexts/CommentsContext'),
  useCommentsContext: jest.fn(),
}));


describe('CommentForm Component', () => {
  const mockAddComment = commentsService.addCommentToPost as jest.Mock;
  const mockDispatchComments = jest.fn(); // Mock dispatch from CommentsContext

  const postId = 1;

  beforeEach(() => {
    mockAddComment.mockReset();
    mockDispatchComments.mockReset();
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: { id: 1 } });
    (useCommentsContext as jest.Mock).mockReturnValue({ dispatchComments: mockDispatchComments });
  });

  const renderForm = () => render(
    <AuthProvider>
      <CommentsProvider postId={postId}>
        <CommentForm postId={postId} />
      </CommentsProvider>
    </AuthProvider>
  );

  test('renders comment form if user is authenticated', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/add your comment.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument();
  });

  test('does not render comment form if user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    renderForm();
    expect(screen.queryByPlaceholderText(/add your comment.../i)).not.toBeInTheDocument();
    // Or expect a "Login to comment" message
    expect(screen.getByText(/please login to add a comment./i)).toBeInTheDocument();
  });

  test('allows typing in comment textarea', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/add your comment.../i), 'My new comment');
    expect(screen.getByPlaceholderText(/add your comment.../i)).toHaveValue('My new comment');
  });

  test('submits comment and clears form on success', async () => {
    const newComment = { id: 3, content: 'My new comment', author: { username: 'testuser' }, /* other fields */ };
    mockAddComment.mockResolvedValueOnce({ success: true, comment: newComment });
    renderForm();

    await userEvent.type(screen.getByPlaceholderText(/add your comment.../i), 'My new comment');
    await userEvent.click(screen.getByRole('button', { name: /post comment/i }));

    await waitFor(() => {
      expect(mockAddComment).toHaveBeenCalledWith(postId, 'My new comment', undefined); // postId, content, parentId
      expect(mockDispatchComments).toHaveBeenCalledWith({
        type: 'ADD_COMMENT',
        payload: newComment,
      });
      expect(screen.getByPlaceholderText(/add your comment.../i)).toHaveValue(''); // Form cleared
    });
  });

  test('displays error message on submission failure', async () => {
    mockAddComment.mockRejectedValueOnce({
      response: { data: { success: false, error: { message: 'Comment too long' } } }
    });
    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/add your comment.../i), 'This is a very long comment...');
    await userEvent.click(screen.getByRole('button', { name: /post comment/i }));

    await waitFor(() => {
      expect(screen.getByText(/comment too long/i)).toBeInTheDocument();
    });
  });

  test('validates for empty comment submission (client-side)', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /post comment/i }));

    await waitFor(() => {
      expect(screen.getByText(/comment cannot be empty/i)).toBeInTheDocument();
      expect(mockAddComment).not.toHaveBeenCalled();
    });
  });
});
```

---

### Sprint 7 Deliverables

**Backend API (Pragmatic MVP assumption for comments):**
- [ ] `POST /api/posts/:postId/comments` endpoint:
    - Accepts `content` (and optionally `parent_id` for replies, though replies UI might be deferred).
    - Associates comment with `postId` and authenticated `author_id`.
    - Returns created comment with 201 status.
    - Requires authentication.
    - Validates content length.
- [ ] `GET /api/posts/:postId/comments` endpoint:
    - Retrieves comments for a given `postId`.
    - Supports basic pagination.
    - Returns comments with author information.
- [ ] `comments` table in database (id, post_id, author_id, content, parent_id, upvotes_count, created_at).

**Frontend API Services:**
- [ ] `commentsService.ts` module created with:
    - `fetchCommentsByPostId(postId, paginationOptions)` function.
    - `addCommentToPost(postId, content, parentId?)` function.

**Frontend Components:**
- [ ] `CommentList.tsx` component to display a list of comments, handling loading and error states.
- [ ] `CommentCard.tsx` component to render individual comment details (author username, content, timestamp).
- [ ] `CommentForm.tsx` component for authenticated users to type and submit new comments.

**Integration & State Management:**
- [ ] `CommentList` and `CommentForm` integrated into the post detail view (e.g., within a `PostDetailPage.tsx` or an expanded `PostCard`).
- [ ] `CommentsContext.tsx` (or similar global/local state management) for fetching, storing, and adding comments for a specific post.
- [ ] Optimistic UI updates for newly added comments.

**UI/UX:**
- [ ] Clear display of comments under posts.
- [ ] User-friendly form for adding comments.
- [ ] Appropriate loading and error messages for comment operations.
- [ ] Conditional display of comment form based on authentication state.

**Testing:**
- [ ] Backend: Integration tests for comment creation and retrieval endpoints.
- [ ] Frontend: Unit tests for `commentsService` functions.
- [ ] Frontend: Component tests (RTL) for `CommentCard`, `CommentList`, and `CommentForm`.
- [ ] Frontend: Integration tests for the post detail view showing comments and comment form interaction.

---

This completes Sprint 7. Users can now engage in basic discussions on posts. Sprint 8 will introduce basic real-time updates for new posts using Server-Sent Events (SSE).

---

## Sprint 8: Basic Real-Time Updates with Server-Sent Events (SSE) (Weeks 15-16)

### Sprint Goal
When a new post is created, connected frontend clients receive this new post data in near real-time via Server-Sent Events (SSE) and dynamically update the Post Feed and/or the 2D Map views without requiring a manual refresh.

---

### User Stories & Acceptance Criteria

#### US-G019: See New Posts Appear in Real-Time (Feed & Map - SSE)
**As a user viewing the post feed or map, I want new posts created by other users to appear automatically without me needing to refresh the page, so that I can stay up-to-date with the latest intelligence as it's shared.**

**Acceptance Criteria:**
- [ ] Backend exposes an SSE endpoint (e.g., `GET /api/stream`).
- [ ] When a new post is successfully created on the backend, an event containing the new post data is emitted through all active SSE connections.
- [ ] Frontend establishes an SSE connection to the `/api/stream` endpoint when the Feed or Map page is active.
- [ ] On receiving a 'new_post' event via SSE:
    - The Post Feed page dynamically prepends the new post to the existing list.
    - The Map View page dynamically adds a new marker for the new post.
- [ ] Frontend gracefully handles SSE connection errors or disconnections (e.g., attempts basic reconnection).
- [ ] The update should feel near real-time (e.g., within a few seconds of post creation).

**Tests Required:**

**Backend SSE Tests:**
```javascript
// test/realtime/sse.test.js
const request = require('supertest');
const app = require('../src/app'); // Your Express app
const EventSource = require('eventsource'); // For testing SSE client-side
const { generateTokenForUser } = require('../src/utils/testHelpers');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('SSE /api/stream', () => {
  let sseClient;
  let testUser, authToken;

  beforeAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    const hashedPass = await bcrypt.hash('Password123', 10);
    let res = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *', ['sseUser', 'sse@example.com', hashedPass]);
    testUser = res.rows[0];
    authToken = generateTokenForUser(testUser);
  });

  afterEach(() => {
    if (sseClient) {
      sseClient.close();
      sseClient = null;
    }
  });
  
  afterAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    await pool.end();
  });

  test('should send a "new_post" event when a new post is created', (done) => {
    const streamUrl = `${app.locals.server.url}/api/stream`; // Assuming server URL is available
    sseClient = new EventSource(streamUrl);
    let eventReceived = false;

    sseClient.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_post') {
        expect(data.payload.content).toBe('SSE test post');
        expect(data.payload.author_id).toBe(testUser.id);
        eventReceived = true;
        sseClient.close(); // Close after receiving the expected event
        done();
      }
    };

    sseClient.onerror = (err) => {
      sseClient.close();
      done(err); // Fail test on SSE error
    };
    
    // After SSE connection is established (needs a slight delay or ready state check)
    setTimeout(async () => {
      try {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'SSE test post', latitude: 10, longitude: 10 })
          .expect(201);
        // The post creation should trigger the SSE event
      } catch (postError) {
        done(postError); // Fail test if post creation fails
      }
    }, 500); // Delay to ensure SSE connection is open
  }, 10000); // Timeout for the test

  test('should allow multiple clients to connect and receive events', async () => {
    const streamUrl = `${app.locals.server.url}/api/stream`;
    const client1Messages = [];
    const client2Messages = [];

    const client1 = new EventSource(streamUrl);
    client1.onmessage = (event) => client1Messages.push(JSON.parse(event.data));
    client1.onerror = (err) => console.error('Client 1 SSE Error:', err);

    const client2 = new EventSource(streamUrl);
    client2.onmessage = (event) => client2Messages.push(JSON.parse(event.data));
    client2.onerror = (err) => console.error('Client 2 SSE Error:', err);
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for connections

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Multi-client SSE test', latitude: 20, longitude: 20 })
      .expect(201);

    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for events to propagate

    expect(client1Messages.some(msg => msg.type === 'new_post' && msg.payload.content === 'Multi-client SSE test')).toBe(true);
    expect(client2Messages.some(msg => msg.type === 'new_post' && msg.payload.content === 'Multi-client SSE test')).toBe(true);

    client1.close();
    client2.close();
  });
});
```

**Frontend SSE Integration Tests (using React Testing Library & mocking EventSource):**
```javascript
// test/frontend/RealTimeFeed.test.tsx
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { PostsProvider, usePostsContext } from '../src/contexts/PostsContext';
import FeedPage from '../src/pages/FeedPage'; // Assuming FeedPage integrates SSE
import * as postsService from '../src/services/postsService';

jest.mock('../src/services/postsService');

// Mock EventSource
const mockEventSourceInstance = {
  onmessage: null,
  onerror: null,
  close: jest.fn(),
  addEventListener: jest.fn((event, cb) => {
    if (event === 'new_post') mockEventSourceInstance.onmessage = cb; // Simplified mapping
    if (event === 'error') mockEventSourceInstance.onerror = cb;
  }),
  removeEventListener: jest.fn(),
};
global.EventSource = jest.fn(() => mockEventSourceInstance) as jest.Mock;


describe('FeedPage with SSE updates', () => {
  const mockFetchPosts = postsService.fetchPosts as jest.Mock;

  beforeEach(() => {
    mockFetchPosts.mockReset();
    mockEventSourceInstance.close.mockClear();
    mockEventSourceInstance.addEventListener.mockClear();
    // Reset onmessage/onerror for fresh setup per test
    mockEventSourceInstance.onmessage = null; 
    mockEventSourceInstance.onerror = null;
  });
  
  const initialPosts = [
    { id: 1, content: 'Initial Post 1', author: { username: 'user1' }, created_at: new Date().toISOString() },
  ];

  const newPostFromSSE = {
    id: 2, content: 'New SSE Post', author: { username: 'sse_user' }, created_at: new Date().toISOString() 
  };

  test('displays initial posts and dynamically adds new post from SSE', async () => {
    mockFetchPosts.mockResolvedValueOnce({ posts: initialPosts, pagination: { total: 1 } });
    
    render(
      <AuthProvider>
        <PostsProvider>
          <MemoryRouter initialEntries={['/feed']}>
            <Routes><Route path="/feed" element={<FeedPage />} /></Routes>
          </MemoryRouter>
        </PostsProvider>
      </AuthProvider>
    );

    // Wait for initial posts to load
    await waitFor(() => {
      expect(screen.getByText('Initial Post 1')).toBeInTheDocument();
    });

    // Simulate SSE event
    act(() => {
      if (mockEventSourceInstance.onmessage) {
        mockEventSourceInstance.onmessage({ data: JSON.stringify({ type: 'new_post', payload: newPostFromSSE }) });
      }
    });

    // Wait for new post to appear
    await waitFor(() => {
      expect(screen.getByText('New SSE Post')).toBeInTheDocument();
      expect(screen.getByText('sse_user')).toBeInTheDocument();
      // Check that it's prepended (appears before initial post, depending on sort order)
      const posts = screen.getAllByRole('article'); // Assuming PostCard has role article
      expect(posts[0]).toHaveTextContent('New SSE Post');
    });
  });

  test('handles SSE connection error gracefully', async () => {
    mockFetchPosts.mockResolvedValueOnce({ posts: initialPosts, pagination: { total: 1 } });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <AuthProvider>
        <PostsProvider>
          <MemoryRouter initialEntries={['/feed']}>
            <Routes><Route path="/feed" element={<FeedPage />} /></Routes>
          </MemoryRouter>
        </PostsProvider>
      </AuthProvider>
    );
    
    await waitFor(() => { /* Initial load */ });

    // Simulate SSE error
    act(() => {
      if (mockEventSourceInstance.onerror) {
        mockEventSourceInstance.onerror(new Event('error'));
      }
    });

    // Check for some indication or graceful handling
    // e.g., a console warning or a subtle UI indicator if implemented
    await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('SSE connection error'));
    });
    consoleWarnSpy.mockRestore();
  });
});
```

---

### Sprint 8 Deliverables

**Backend Enhancements:**
- [ ] SSE endpoint (`GET /api/stream`) implemented using `text/event-stream`.
- [ ] Backend logic to use an event emitter (e.g., Node.js `EventEmitter`) to broadcast `'new_post'` events.
- [ ] Post creation service modified to emit `'new_post'` event upon successful post creation.
- [ ] Management of connected SSE clients (adding to/removing from the broadcast list).

**Frontend Real-Time Logic:**
- [ ] `SSEService.ts` (or a custom hook like `useSSE`) created to:
    - Establish and manage an `EventSource` connection to `/api/stream`.
    - Listen for `message` events, specifically parsing for `new_post` type.
    - Provide a way for components to subscribe to these events (e.g., via callbacks or context updates).
    - Handle `error` and `open` events from `EventSource`, including basic reconnection attempts.
- [ ] `FeedPage.tsx` component updated:
    - Initializes SSE connection on mount.
    - Subscribes to `'new_post'` events.
    - Dynamically prepends new posts received via SSE to the `PostsContext` or local state.
- [ ] `MapViewPage.tsx` component updated:
    - Initializes SSE connection on mount (if map is a primary real-time view).
    - Subscribes to `'new_post'` events.
    - Dynamically adds new post markers to the map when posts are received via SSE.

**UI/UX:**
- [ ] New posts appear in the Feed and on the Map without manual page refresh.
- [ ] (Optional) Subtle visual indicator for newly arrived posts.

**Testing:**
- [ ] Backend: Integration tests for the SSE endpoint, verifying event emission on new post creation. Test multiple client connections.
- [ ] Frontend: Unit tests for the `SSEService` / `useSSE` hook (mocking `EventSource`).
- [ ] Frontend: Component tests (RTL) for `FeedPage` and `MapViewPage` simulating SSE events and verifying UI updates.

**Documentation:**
- [ ] Notes on the SSE implementation (backend and frontend).
- [ ] Basic troubleshooting steps for SSE connection issues.

---

This completes Sprint 8. The application now has a basic real-time capability for new posts. Sprint 9 will start "Month 4: Community Notes" by focusing on the backend and basic frontend display for community notes.

---

## Sprint 9: Backend for Community Notes & Basic Frontend Display (Weeks 17-18)

### Sprint Goal
Implement the backend API and database structure for basic Community Notes. On the frontend, display these notes associated with a post. Authenticated users will be able to submit a new Community Note for a specific post via API (frontend form for submission will be in Sprint 10).

---

### User Stories & Acceptance Criteria

#### US-G020: View Community Notes on a Post (API & Frontend Display)
**As a user, I want to see community-contributed notes (context, corrections) associated with a post, so that I can get more information and assess the credibility of the post.**

**Acceptance Criteria (Backend - GET /api/posts/:postId/notes):**
- [ ] API endpoint `GET /api/posts/:postId/notes` retrieves notes for a specific post.
- [ ] By default, retrieves all notes (MVP simplicity, `is_published` filter can be added later).
- [ ] Each note in the response includes `id`, `content`, `author_id` (or basic author info like username), `created_at`, `helpful_count`.
- [ ] Returns an empty list if the post has no notes.
- [ ] Returns 404 if the `postId` does not exist.

**Acceptance Criteria (Frontend - Display):**
- [ ] When viewing a post's details, a section for community notes is displayed.
- [ ] Frontend fetches notes for the current post using the `GET /api/posts/:postId/notes` endpoint.
- [ ] Each note is rendered using a `CommunityNoteCard` component.
- [ ] `CommunityNoteCard` displays note content, author's username, and creation timestamp.
- [ ] A loading state is shown while notes are being fetched.
- [ ] If no notes exist, a message like "No community notes yet." is shown.

**Tests Required:**

**Backend API Tests (`GET /api/posts/:postId/notes`):**
```javascript
// test/notes/get_notes.api.test.js
const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { generateTokenForUser, createTestUser, createTestPost } = require('../src/utils/testHelpers');

describe('GET /api/posts/:postId/notes', () => {
  let user1, post1, note1, note2;

  beforeAll(async () => {
    await pool.query('TRUNCATE TABLE community_notes, posts, users CASCADE');
    user1 = await createTestUser(pool, 'noteUser1', 'noteuser1@example.com');
    post1 = await createTestPost(pool, user1.id, 'Post with notes', 10, 10);

    // Create some notes for post1
    note1 = (await pool.query(
      'INSERT INTO community_notes (post_id, author_id, content, helpful_count) VALUES ($1, $2, $3, $4) RETURNING *',
      [post1.id, user1.id, 'First note for post1', 5]
    )).rows[0];
    note2 = (await pool.query(
      'INSERT INTO community_notes (post_id, author_id, content) VALUES ($1, $2, $3) RETURNING *',
      [post1.id, user1.id, 'Second note for post1']
    )).rows[0];
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE community_notes, posts, users CASCADE');
    await pool.end();
  });

  test('retrieves all notes for a given post ID', async () => {
    const response = await request(app)
      .get(`/api/posts/${post1.id}/notes`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.notes).toBeInstanceOf(Array);
    expect(response.body.notes.length).toBe(2);
    
    const noteContents = response.body.notes.map(n => n.content);
    expect(noteContents).toContain('First note for post1');
    expect(noteContents).toContain('Second note for post1');

    response.body.notes.forEach(note => {
      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('content');
      expect(note).toHaveProperty('author_id'); // Or expanded author object
      expect(note).toHaveProperty('created_at');
      expect(note).toHaveProperty('helpful_count');
    });
  });

  test('returns an empty array if a post has no notes', async () => {
    const postWithoutNotes = await createTestPost(pool, user1.id, 'Post without notes', 20, 20);
    const response = await request(app)
      .get(`/api/posts/${postWithoutNotes.id}/notes`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.notes).toEqual([]);
  });

  test('returns 404 if the post_id does not exist', async () => {
    const nonExistentPostId = post1.id + 999;
    await request(app)
      .get(`/api/posts/${nonExistentPostId}/notes`)
      .expect(404);
  });
});
```

**Frontend Component Tests (CommunityNoteCard, CommunityNoteList):**
```javascript
// test/frontend/CommunityNoteList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { NotesProvider } from '../src/contexts/NotesContext'; // Assuming NotesContext
import CommunityNoteList from '../src/components/notes/CommunityNoteList';
import * as notesService from '../src/services/notesService';

jest.mock('../src/services/notesService');

const mockCommunityNotes = [
  { id: 1, postId: 1, content: 'Helpful context note.', author: { username: 'noteAuthor1' }, created_at: new Date().toISOString(), helpful_count: 10 },
  { id: 2, postId: 1, content: 'Correction to the post.', author: { username: 'noteAuthor2' }, created_at: new Date(Date.now() - 60000).toISOString(), helpful_count: 5 },
];

describe('CommunityNoteList Component', () => {
  const mockFetchNotes = notesService.fetchNotesForPost as jest.Mock;

  beforeEach(() => {
    mockFetchNotes.mockReset();
  });

  const renderList = (postId = 1) => render(
    <AuthProvider>
      <NotesProvider postId={postId}>
        <MemoryRouter> {/* If CommunityNoteCard uses Link */}
          <CommunityNoteList postId={postId} />
        </MemoryRouter>
      </NotesProvider>
    </AuthProvider>
  );

  test('fetches and displays a list of community notes', async () => {
    mockFetchNotes.mockResolvedValueOnce({ notes: mockCommunityNotes });
    renderList(1);

    // expect(screen.getByText(/loading notes.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetchNotes).toHaveBeenCalledWith(1);
      expect(screen.getByText('Helpful context note.')).toBeInTheDocument();
      expect(screen.getByText('noteAuthor1')).toBeInTheDocument();
      expect(screen.getByText('Correction to the post.')).toBeInTheDocument();
      expect(screen.getByText('noteAuthor2')).toBeInTheDocument();
    });
  });

  test('displays "No community notes yet" if no notes are available', async () => {
    mockFetchNotes.mockResolvedValueOnce({ notes: [] });
    renderList(1);

    await waitFor(() => {
      expect(screen.getByText(/no community notes yet for this post./i)).toBeInTheDocument();
    });
  });
});

// test/frontend/CommunityNoteCard.test.tsx
import { render, screen } from '@testing-library/react';
import CommunityNoteCard from '../src/components/notes/CommunityNoteCard'; // Assuming path
import { formatDistanceToNow } from 'date-fns';

describe('CommunityNoteCard Component', () => {
  const note = {
    id: 1,
    postId: 1,
    content: 'This is a test community note.',
    author: { id: 1, username: 'noteTaker', reputation: 20, email: '' }, // Add other required fields
    created_at: new Date().toISOString(),
    helpful_count: 7,
    note_type: 'context', status: 'published', not_helpful_votes: 1, total_votes: 8, helpfulness_score: 0.8, sources: [], published_at: new Date().toISOString(), user_vote: null
  };

  test('renders note content, author, and timestamp', () => {
    render(<MemoryRouter><CommunityNoteCard note={note} /></MemoryRouter>);
    expect(screen.getByText('This is a test community note.')).toBeInTheDocument();
    expect(screen.getByText('noteTaker')).toBeInTheDocument();
    const expectedTime = formatDistanceToNow(new Date(note.created_at), { addSuffix: true });
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // Helpful count
  });
});
```

#### US-G021: Backend Support for Adding a Community Note
**As an authenticated user (via API client/Postman for this sprint), I want to be able to submit a textual note to a specific post through the backend API, so that my note can be stored and associated with that post for later display and interaction.**

**Acceptance Criteria (Backend - POST /api/posts/:postId/notes):**
- [ ] API endpoint `POST /api/posts/:postId/notes` accepts `content`.
- [ ] Requires JWT authentication; unauthenticated requests return 401.
- [ ] `content` is required and has a maximum length (e.g., 1000 characters).
- [ ] Successful note creation returns a 201 status with the full created note data, including `author_id`, `post_id`, and `created_at`.
- [ ] Notes are stored in the `community_notes` table with `is_published` defaulting to `false` (or `true` for MVP simplicity) and `helpful_count` to `0`.
- [ ] Fails with 400 error for missing `content` or content exceeding max length.
- [ ] Fails with 404 error if `postId` does not exist.

**Tests Required (Backend API Tests):**
```javascript
// test/notes/create_note.api.test.js
const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { generateTokenForUser, createTestUser, createTestPost } = require('../src/utils/testHelpers');

describe('POST /api/posts/:postId/notes', () => {
  let user1, post1, authToken;

  beforeAll(async () => {
    await pool.query('TRUNCATE TABLE community_notes, posts, users CASCADE');
    user1 = await createTestUser(pool, 'noteCreator', 'notecreator@example.com');
    post1 = await createTestPost(pool, user1.id, 'Post to add notes to', 30, 30);
    authToken = generateTokenForUser(user1);
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE community_notes, posts, users CASCADE');
    await pool.end();
  });

  test('successfully creates a new community note for an authenticated user', async () => {
    const noteData = {
      content: 'This is an important context note for the post.'
    };
    const response = await request(app)
      .post(`/api/posts/${post1.id}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(noteData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.note).toMatchObject({
      content: noteData.content,
      author_id: user1.id,
      post_id: post1.id,
      is_published: false, // Or true for MVP, check your default
      helpful_count: 0
    });
    expect(response.body.note.id).toBeDefined();

    // Verify in DB
    const dbNote = await pool.query('SELECT * FROM community_notes WHERE id = $1', [response.body.note.id]);
    expect(dbNote.rows).toHaveLength(1);
  });

  test('rejects note creation if not authenticated', async () => {
    await request(app)
      .post(`/api/posts/${post1.id}/notes`)
      .send({ content: 'Unauthenticated note' })
      .expect(401);
  });

  test('rejects note creation with missing content', async () => {
    await request(app)
      .post(`/api/posts/${post1.id}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);
  });

  test('rejects note creation for a non-existent post', async () => {
    const nonExistentPostId = post1.id + 999;
    await request(app)
      .post(`/api/posts/${nonExistentPostId}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Note for non-existent post' })
      .expect(404);
  });
});
```

---

### Sprint 9 Deliverables

**Backend Infrastructure:**
- [ ] `CommunityNote` model and associated database service logic.
- [ ] Validation logic for community note creation.

**Database Schema:**
```sql
-- community_notes table for Sprint 9
CREATE TABLE community_notes (
    id SERIAL PRIMARY KEY, -- Using SERIAL for pragmatic MVP
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
    is_published BOOLEAN DEFAULT FALSE, -- For MVP, might default to TRUE and hide moderation
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Add trigger
);

CREATE INDEX idx_community_notes_post_id ON community_notes (post_id);
CREATE INDEX idx_community_notes_author_id ON community_notes (author_id);

CREATE TRIGGER community_notes_updated_at_trigger
BEFORE UPDATE ON community_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**API Enhancements:**
- [ ] `POST /api/posts/:postId/notes`: Create a new community note for a post (requires authentication).
- [ ] `GET /api/posts/:postId/notes`: Retrieve community notes for a post (public).

**Frontend API Services:**
- [ ] `notesService.ts` (or similar) created with `fetchNotesForPost(postId)` function.

**Frontend Components:**
- [ ] `CommunityNoteCard.tsx` component to display individual note details (author username, content, timestamp, helpful count).
- [ ] `CommunityNoteList.tsx` component to fetch and display a list of notes for a post, integrated into the post detail view.

**State Management:**
- [ ] `NotesContext.tsx` (or similar) for managing fetching and display of community notes related to a post.

**Testing:**
- [ ] Backend: Integration tests for community note creation and retrieval endpoints.
- [ ] Frontend: Unit tests for `notesService` (fetch notes).
- [ ] Frontend: Component tests (RTL) for `CommunityNoteCard` and `CommunityNoteList` (displaying fetched notes).

**Documentation:**
- [ ] API documentation updated for new community note endpoints.

---

This completes Sprint 9. The backend for community notes is ready, and users can view them on the frontend. Sprint 10 will add the frontend form for submitting notes and the "mark as helpful" functionality.

---

## Sprint 10: Frontend Community Note Submission & Simple Voting (Weeks 19-20)

### Sprint Goal
Authenticated users can add new Community Notes to posts using a frontend form. All users can mark a Community Note as "helpful," and this count is displayed and updated in the UI.

---

### User Stories & Acceptance Criteria

#### US-G022: Add a Community Note from Frontend
**As an authenticated user, I want to see a form where I can type and submit a community note for a post I am viewing, so that I can easily contribute context or corrections to the intelligence.**

**Acceptance Criteria:**
- [ ] A `CommunityNoteForm` component is displayed on the post detail view if the user is authenticated.
- [ ] The form contains a textarea for note content and a "Submit Note" button.
- [ ] Submitting the form calls the backend `POST /api/posts/:postId/notes` endpoint with the content via a frontend API service.
- [ ] On successful note submission (201 status from backend):
    - The new note is optimistically added to the displayed `CommunityNoteList`.
    - The form textarea is cleared.
- [ ] On submission failure (e.g., 400/401 from backend):
    - Backend error messages are displayed on the form.
- [ ] Client-side validation prevents submission of an empty note.
- [ ] Unauthenticated users do not see the form (or it's disabled with a login prompt).

**Tests Required (using React Testing Library):**
```javascript
// test/frontend/CommunityNoteForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { NotesProvider, useNotesContext } from '../src/contexts/NotesContext';
import CommunityNoteForm from '../src/components/notes/CommunityNoteForm';
import * as notesService from '../src/services/notesService';

jest.mock('../src/services/notesService');
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'),
  useAuth: jest.fn(),
}));
jest.mock('../src/contexts/NotesContext', () => ({
  ...jest.requireActual('../src/contexts/NotesContext'),
  useNotesContext: jest.fn(),
}));

describe('CommunityNoteForm Component', () => {
  const mockAddNote = notesService.addNoteToPost as jest.Mock;
  const mockDispatchNotes = jest.fn();
  const postId = 1;

  beforeEach(() => {
    mockAddNote.mockReset();
    mockDispatchNotes.mockReset();
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: { id: 1 } });
    (useNotesContext as jest.Mock).mockReturnValue({ dispatchNotes: mockDispatchNotes });
  });

  const renderForm = () => render(
    <AuthProvider>
      <NotesProvider postId={postId}>
        <CommunityNoteForm postId={postId} />
      </NotesProvider>
    </AuthProvider>
  );

  test('renders note form if user is authenticated', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/add your context or correction.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit note/i })).toBeInTheDocument();
  });

  test('submits note and clears form on success', async () => {
    const newNote = { id: 3, content: 'My insightful note', author: { username: 'testuser' }, /* other fields */ };
    mockAddNote.mockResolvedValueOnce({ success: true, note: newNote });
    renderForm();

    await userEvent.type(screen.getByPlaceholderText(/add your context or correction.../i), 'My insightful note');
    await userEvent.click(screen.getByRole('button', { name: /submit note/i }));

    await waitFor(() => {
      expect(mockAddNote).toHaveBeenCalledWith(postId, 'My insightful note');
      expect(mockDispatchNotes).toHaveBeenCalledWith({
        type: 'ADD_NOTE',
        payload: newNote,
      });
      expect(screen.getByPlaceholderText(/add your context or correction.../i)).toHaveValue('');
    });
  });
  
  test('shows login prompt if user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    renderForm();
    expect(screen.queryByPlaceholderText(/add your context or correction.../i)).not.toBeInTheDocument();
    expect(screen.getByText(/please login to add a community note./i)).toBeInTheDocument();
  });

  test('validates for empty note submission', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /submit note/i }));

    await waitFor(() => {
      expect(screen.getByText(/note content cannot be empty/i)).toBeInTheDocument();
      expect(mockAddNote).not.toHaveBeenCalled();
    });
  });
});
```

#### US-G023: Mark a Community Note as Helpful (Frontend & API)
**As a user, I want to be able to indicate that I find a community note helpful, so that the platform can identify and potentially prioritize more valuable notes.**

**Acceptance Criteria (Backend - POST /api/notes/:noteId/vote):**
- [ ] API endpoint `POST /api/notes/:noteId/vote` is created.
- [ ] Accepts a simple payload (e.g., `{ vote: 1 }` for helpful, or implicitly helpful if no other vote types yet).
- [ ] Requires JWT authentication.
- [ ] Increments `helpful_count` on the `community_notes` table for the given `noteId`.
- [ ] A `votes` table (or similar, possibly extending the one from Sprint 6) records `user_id` and `note_id` to prevent duplicate "helpful" marks from the same user on the same note.
- [ ] (Optional for MVP, could be one-way): If user clicks again, it removes their "helpful" vote and decrements count.
- [ ] Returns 200 status with updated `helpful_count` and user's vote state.
- [ ] Returns 404 if `noteId` does not exist.

**Acceptance Criteria (Frontend - "Mark as Helpful" UI):**
- [ ] `CommunityNoteCard` displays a "Mark as Helpful" button/icon and the current `helpful_count`.
- [ ] Clicking the "Mark as Helpful" button (when authenticated) sends a request to `POST /api/notes/:noteId/vote`.
- [ ] UI optimistically updates the `helpful_count` and button state.
- [ ] If backend call fails, UI reverts and shows an error.
- [ ] Button state visually indicates if the current user has already marked the note as helpful (e.g., toggled, disabled).
- [ ] Unauthenticated users are prompted to log in or the button is disabled.

**Tests Required:**

**Backend API Tests (`POST /api/notes/:noteId/vote`):**
```javascript
// test/notes/vote_note.api.test.js
const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { generateTokenForUser, createTestUser, createTestPost, createTestNote } = require('../src/utils/testHelpers');

describe('POST /api/notes/:noteId/vote', () => {
  let user1, user2, post1, note1, authToken1, authToken2;

  beforeAll(async () => {
    await pool.query('TRUNCATE TABLE votes, community_notes, posts, users CASCADE');
    user1 = await createTestUser(pool, 'noteVoter1', 'voter1@example.com');
    user2 = await createTestUser(pool, 'noteVoter2', 'voter2@example.com');
    post1 = await createTestPost(pool, user1.id, 'Post for note voting', 40, 40);
    note1 = await createTestNote(pool, post1.id, user2.id, 'A note to be voted on'); // Note by user2
    authToken1 = generateTokenForUser(user1);
    authToken2 = generateTokenForUser(user2); // For testing voting on own note if allowed/disallowed
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE votes, community_notes, posts, users CASCADE');
    await pool.end();
  });

  test('allows an authenticated user to mark a note as helpful', async () => {
    const initialNote = await pool.query('SELECT helpful_count FROM community_notes WHERE id = $1', [note1.id]);
    const initialHelpfulCount = initialNote.rows[0].helpful_count;

    const response = await request(app)
      .post(`/api/notes/${note1.id}/vote`)
      .set('Authorization', `Bearer ${authToken1}`)
      .send({ vote: 1 }) // 1 for helpful
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.helpful_count).toBe(initialHelpfulCount + 1);
    expect(response.body.user_vote_status).toBe('helpful'); // Or similar

    const updatedNote = await pool.query('SELECT helpful_count FROM community_notes WHERE id = $1', [note1.id]);
    expect(updatedNote.rows[0].helpful_count).toBe(initialHelpfulCount + 1);
  });

  test('prevents a user from marking a note as helpful multiple times', async () => {
    // First vote already placed in previous test by user1
    const response = await request(app)
      .post(`/api/notes/${note1.id}/vote`)
      .set('Authorization', `Bearer ${authToken1}`)
      .send({ vote: 1 })
      .expect(409); // Conflict - already voted

    expect(response.body.error.message).toContain('already voted');
  });

  test('allows a user to remove their helpful vote (if implemented)', async () => {
    // Assuming previous tests made user1 vote helpful. Now try to remove.
    // If not implemented, this test should verify one-way voting.
    const removeVoteResponse = await request(app)
      .post(`/api/notes/${note1.id}/vote`)
      .set('Authorization', `Bearer ${authToken1}`)
      .send({ vote: 0 }) // 0 to remove vote
      .expect(200);
    
    expect(removeVoteResponse.body.helpful_count).toBe(note1.helpful_count); // Back to original count before this user's vote
    expect(removeVoteResponse.body.user_vote_status).toBeNull(); // Or 'none'
  });

  test('rejects voting if not authenticated', async () => {
    await request(app)
      .post(`/api/notes/${note1.id}/vote`)
      .send({ vote: 1 })
      .expect(401);
  });

  test('returns 404 if note_id does not exist', async () => {
    const nonExistentNoteId = note1.id + 999;
    await request(app)
      .post(`/api/notes/${nonExistentNoteId}/vote`)
      .set('Authorization', `Bearer ${authToken1}`)
      .send({ vote: 1 })
      .expect(404);
  });
});
```

**Frontend Component Tests (Helpful Button in `CommunityNoteCard`):**
```javascript
// test/frontend/CommunityNoteCardHelpful.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { NotesProvider, useNotesContext } // Assuming context for notes
from '../src/contexts/NotesContext';
import CommunityNoteCard from '../src/components/notes/CommunityNoteCard';
import * as notesService from '../src/services/notesService';

jest.mock('../src/services/notesService');
jest.mock('../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../src/contexts/AuthContext'),
  useAuth: jest.fn(),
}));
jest.mock('../src/contexts/NotesContext', () => ({
  ...jest.requireActual('../src/contexts/NotesContext'),
  useNotesContext: jest.fn(),
}));

describe('CommunityNoteCard - Helpful Voting', () => {
  const mockVoteOnNote = notesService.voteOnCommunityNote as jest.Mock;
  const mockDispatchNotes = jest.fn();

  const note = {
    id: 1, postId: 1, content: 'Note content', author: { username: 'author' },
    created_at: new Date().toISOString(), helpful_count: 5, user_vote: null, /* other fields */
  };

  beforeEach(() => {
    mockVoteOnNote.mockReset();
    mockDispatchNotes.mockReset();
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: { id: 1 } });
    (useNotesContext as jest.Mock).mockReturnValue({ dispatchNotes: mockDispatchNotes });
  });
  
  const renderCard = (noteProps = {}) => {
    const currentNote = { ...note, ...noteProps };
    return render(
      <AuthProvider>
        <NotesProvider postId={currentNote.postId}>
            <CommunityNoteCard note={currentNote} />
        </NotesProvider>
      </AuthProvider>
    );
  };

  test('displays helpful button and count', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /mark as helpful/i })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Initial helpful count
  });

  test('calls voteOnCommunityNote service when helpful button is clicked', async () => {
    mockVoteOnNote.mockResolvedValueOnce({ success: true, helpful_count: 6, user_vote_status: 'helpful' });
    renderCard();

    await userEvent.click(screen.getByRole('button', { name: /mark as helpful/i }));

    await waitFor(() => {
      expect(mockVoteOnNote).toHaveBeenCalledWith(note.id, 1); // Assuming 1 for helpful
      expect(mockDispatchNotes).toHaveBeenCalledWith({
        type: 'UPDATE_NOTE_VOTES',
        payload: { noteId: note.id, helpful_count: 6, user_vote_status: 'helpful' },
      });
    });
  });

  test('disables button or shows login prompt if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null });
    renderCard();
    
    const helpfulButton = screen.getByRole('button', { name: /mark as helpful/i });
    expect(helpfulButton).toBeDisabled(); 
    // Or, expect a "Login to vote" message to be present if that's the UI pattern
    // expect(screen.getByText(/login to mark as helpful/i)).toBeInTheDocument();
  });
});
```

---

### Sprint 10 Deliverables

**Backend API:**
- [ ] `POST /api/notes/:noteId/vote` endpoint implemented:
    - Increments `helpful_count` on the `community_notes` table.
    - Tracks `user_id` and `note_id` in the `votes` table (or similar, potentially with a `vote_target_type` like 'note' or 'post') to prevent duplicate votes by the same user on the same note.
    - Requires authentication.
    - Returns updated `helpful_count` and user's vote state.

**Frontend API Services:**
- [ ] `notesService.ts` extended with:
    - `addNoteToPost(postId, content)` function.
    - `voteOnCommunityNote(noteId, voteValue)` function (e.g., `voteValue = 1` for helpful).

**Frontend Components:**
- [ ] `CommunityNoteForm.tsx` component for authenticated users to submit new notes (textarea for content, submit button).
- [ ] `CommunityNoteForm` integrated into the post detail view.
- [ ] "Mark as Helpful" button/icon added to `CommunityNoteCard.tsx`.

**State Management & UI/UX:**
- [ ] `NotesContext` (or relevant state) updated to handle adding new notes optimistically or via re-fetch.
- [ ] `NotesContext` (or relevant state) updated to handle optimistic UI updates for `helpful_count` on notes.
- [ ] Visual indication on "Mark as Helpful" button if the current user has already voted.
- [ ] Error handling and display for note submission and voting failures.

**Testing:**
- [ ] Backend: Integration tests for `POST /api/notes/:noteId/vote`.
- [ ] Frontend: Unit tests for `addNoteToPost` and `voteOnCommunityNote` service functions.
- [ ] Frontend: Component tests (RTL) for `CommunityNoteForm` (submission, validation).
- [ ] Frontend: Component tests (RTL) for "Mark as Helpful" functionality in `CommunityNoteCard`.

---

This completes Sprint 10, marking the end of "Month 4: Community Notes" with a basic but functional system for users to add and validate context. Sprint 11 will shift to "Month 5: Polish & Performance," starting with mobile optimization and basic performance tuning.

---

## Sprint 11: Mobile Optimization & Basic Performance Tuning (Weeks 21-22)

### Sprint Goal
Enhance the application's usability on common mobile screen sizes through responsive design improvements. Conduct initial performance profiling on both frontend and backend, addressing 1-2 obvious bottlenecks in each to improve overall responsiveness.

---

### User Stories & Acceptance Criteria

#### US-G024: Smooth Mobile Browsing Experience
**As a user accessing the platform on my mobile phone, I want to be able to easily read content, navigate, and interact with forms and maps without excessive zooming, panning, or broken layouts, so that I can effectively use the platform on the go.**

**Acceptance Criteria:**
- [ ] All key pages (Feed, Map View, Post Detail, Create Post, Login, Register) are fully responsive.
- [ ] No horizontal scrolling occurs on viewports down to 320px width.
- [ ] Font sizes are readable and tap targets (buttons, links, form fields) are adequately sized for touch interaction (min 44x44px effective size).
- [ ] Modals and popups (e.g., map marker popups, post creation form if modal) display correctly and are usable on mobile.
- [ ] Map controls (zoom, pan) are functional and accessible on touch devices.
- [ ] Navigation elements (header) adapt gracefully to smaller screens (e.g., using a hamburger menu if necessary).
- [ ] Forms are easy to fill out on mobile (input fields focus correctly, keyboard doesn't obscure critical elements).

**Tests Required (Primarily Manual & Tool-Assisted):**
-   **Manual Testing:**
    -   Test all key user flows on actual iOS and Android devices (various screen sizes).
    -   Use browser developer tools (responsive design mode) to simulate various viewports (e.g., iPhone SE, iPhone 12/13, Galaxy S20, Pixel 5).
    -   Verify readability, tap target sizes, absence of horizontal scroll, and layout integrity.
-   **Automated Checks (where applicable):**
    -   Existing React Testing Library tests for components should continue to pass after responsive CSS changes. If specific mobile layouts are implemented via JavaScript or different components, new tests would cover those.
    -   Lighthouse audit (in Chrome DevTools) for "Mobile Friendly" and "Performance" (focus on mobile section).
    ```javascript
    // test/accessibility/lighthouse.test.js (Conceptual - often run manually or via CI tools)
    describe('Lighthouse Mobile Friendliness', () => {
      test('Key pages should score well on mobile friendliness', async () => {
        // This would involve a tool like puppeteer to run Lighthouse programmatically
        // For MVP, this is likely a manual check.
        // const report = await runLighthouse('http://localhost:3000/feed', {formFactor: 'mobile'});
        // expect(report.categories.pwa.score).toBeGreaterThan(0.7); // Example check
        // expect(report.audits['viewport'].score).toBe(1);
        expect(true).toBe(true); // Placeholder for manual/tool-assisted verification
      });
    });
    ```

#### US-G025: Reasonable Application Performance
**As a user, I want the application to load pages and display content relatively quickly, without noticeable lag or jank, so that I have a pleasant and efficient user experience.**

**Acceptance Criteria:**
- [ ] Frontend: Identify and address 1-2 major frontend performance bottlenecks (e.g., slow component rendering, large unoptimized images, excessive re-renders).
    -   Example Target: Reduce Largest Contentful Paint (LCP) for Feed/Map page by X% or to < Y seconds on mobile.
- [ ] Backend: Identify and address 1-2 major backend performance bottlenecks (e.g., slow API endpoint, inefficient database query).
    -   Example Target: Reduce P95 response time for `GET /api/posts` by X% or to < Y ms.
- [ ] Scrolling through the post feed is smooth on mobile devices.
- [ ] Map interactions (pan, zoom) remain responsive even with a moderate number of markers.
- [ ] Basic image optimization review: Ensure static UI images are web-optimized; if user media uploads are complex, ensure thumbnails are used in lists.

**Tests Required (Profiling & Benchmarking):**
-   **Frontend Profiling:**
    -   Use browser's Performance tab to identify slow rendering components or long JavaScript tasks.
    -   Use React DevTools Profiler to find components with excessive re-renders.
    -   Measure before/after metrics for any optimizations applied (e.g., LCP, Time to Interactive).
-   **Backend Profiling:**
    -   Monitor API response times (e.g., using `console.time` or a simple APM tool locally).
    -   Use `EXPLAIN ANALYZE` for slow PostgreSQL queries to identify missing indexes or inefficient plans.
    -   Measure before/after metrics for API endpoint response times or query execution times.
    ```javascript
    // test/performance/apiEndpoints.test.js (Example benchmark test)
    const request = require('supertest');
    const app = require('../src/app');

    describe('API Endpoint Performance', () => {
      test('GET /api/posts should respond within target threshold', async () => {
        const startTime = Date.now();
        await request(app).get('/api/posts?limit=20').expect(200);
        const duration = Date.now() - startTime;
        console.log(`GET /api/posts duration: ${duration}ms`);
        // For MVP, this might be a soft check or manual observation.
        // Strict threshold for CI would be e.g. expect(duration).toBeLessThan(500); 
        // but depends on test environment consistency.
        expect(duration).toBeDefined(); // Basic check
      }, 10000); // Test timeout
    });

    // test/performance/dbQueries.test.js (Conceptual for query optimization)
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    describe('Database Query Performance', () => {
      test('Fetching posts query plan uses indexes', async () => {
        // This test would typically be done by running EXPLAIN ANALYZE
        // and asserting that the plan includes an Index Scan, not a Seq Scan.
        const explainResult = await pool.query(
          "EXPLAIN (FORMAT JSON) SELECT * FROM posts ORDER BY created_at DESC LIMIT 20"
        );
        const plan = explainResult.rows[0]['QUERY PLAN'][0]['Plan'];
        // Check for 'Index Scan' or 'Bitmap Heap Scan' on an index
        const usesIndex = JSON.stringify(plan).includes('Index Scan');
        expect(usesIndex).toBe(true); 
      });
    });
    ```

---

### Sprint 11 Deliverables

**Responsive Design & Mobile UI:**
- [ ] All existing pages and components reviewed and updated for responsiveness using Tailwind CSS (media queries, flexbox/grid adjustments).
- [ ] Specific focus on:
    - Feed page (`PostCard` layout on small screens).
    - Map View page (map controls, popup display).
    - Post Creation form (input usability, map picker on mobile).
    - Authentication forms.
    - Header navigation (potential hamburger menu for mobile).
- [ ] Tap targets meet minimum size recommendations.
- [ ] No horizontal overflow on screens down to 320px width.

**Frontend Performance:**
- [ ] Report from frontend profiling tools (Lighthouse, Performance tab) identifying 1-2 top bottlenecks.
- [ ] Implemented fixes for identified frontend bottlenecks (e.g., memoizing components, reducing bundle size of a specific library, optimizing a heavy computation).
- [ ] Documented before/after metrics for the addressed frontend issues.

**Backend Performance:**
- [ ] Report from backend profiling (API response times, `EXPLAIN ANALYZE` for slow queries) identifying 1-2 top bottlenecks.
- [ ] Implemented fixes for identified backend bottlenecks (e.g., adding a database index, optimizing a specific API controller's logic, implementing basic caching for a hot endpoint).
- [ ] Documented before/after metrics for the addressed backend issues.

**Image Optimization:**
- [ ] Review static UI assets (logos, icons) for optimal compression.
- [ ] If user-uploaded media is being displayed, ensure that list views (like the feed) use thumbnails rather than full-sized images. (Full media pipeline optimization is later, this is a basic check).

**Documentation:**
- [ ] Summary of responsive design changes made.
- [ ] Report detailing performance bottlenecks identified and optimizations implemented (frontend and backend), including before/after metrics.

**Testing:**
- [ ] Manual testing across various mobile viewports and representative devices.
- [ ] Existing automated tests (unit, integration) pass after responsive/performance changes.
- [ ] (If applicable) New tests covering any logic changes made for performance optimization.
- [ ] Baseline performance benchmarks recorded for key user flows.

---

This sprint is about stabilization and improving the core user experience. Sprint 12 will continue the "Polish & Performance" month by focusing on basic security hardening and introducing initial search functionality.

---

## Sprint 12: Basic Security Hardening & Initial Search Functionality (Weeks 23-24)

### Sprint Goal
Implement foundational security measures on both backend and frontend to improve baseline security against common web vulnerabilities. Introduce a basic keyword-based search functionality allowing users to find posts containing specific terms.

---

### User Stories & Acceptance Criteria

#### US-G026: Basic Platform Security
**As a platform operator, I want the application to have foundational security measures against common web attacks (like XSS, clickjacking), so that user data and platform integrity are better protected.**

**Acceptance Criteria (Backend):**
- [ ] `Helmet.js` (or equivalent) middleware is implemented and configured to set common security headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
- [ ] Basic rate limiting is reviewed and applied/adjusted on sensitive API endpoints (e.g., auth, post creation, voting) using `express-rate-limit` or similar.
- [ ] User-generated content intended for display is appropriately sanitized or escaped on the backend before storage IF it's meant to be rendered as HTML. (For MVP, if strictly plain text is stored and React handles rendering, this focuses on validating input format).
- [ ] Ensure no sensitive information is inadvertently leaked in API error responses.

**Acceptance Criteria (Frontend):**
- [ ] Review how user-generated content (post content, comments, notes) is rendered; ensure React's default XSS protection is leveraged and no `dangerouslySetInnerHTML` is used with unsanitized user input.
- [ ] External links generated from user content (if any) use `rel="noopener noreferrer"`.
- [ ] Input fields are validated to prevent overly long inputs that could cause issues.

**Tests Required:**

**Backend Security Tests:**
```javascript
// test/security/headers.api.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Security Headers', () => {
  test('should return recommended security headers (Helmet.js)', async () => {
    const response = await request(app).get('/api/posts'); // Any endpoint
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN'); // Or DENY
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['x-download-options']).toBe('noopen');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-xss-protection']).toBe('0'); // Modern browsers recommend CSP over this
    expect(response.headers['content-security-policy']).toBeDefined(); // CSP should be configured
  });
});

// test/security/rateLimiting.api.test.js
describe('API Rate Limiting', () => {
  let testUser, authToken;
  // Setup testUser and authToken before tests...

  test('should limit requests to POST /api/auth/login', async () => {
    // Example: Allow 5 requests per 15 minutes
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: `wrong${i}` }).expect(401);
    }
    await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'wrong6' }).expect(429); // Too Many Requests
  });

  test('should limit requests to POST /api/posts for authenticated users', async () => {
    // Assuming authToken is set for an existing user
    // Example: Allow 10 posts per hour
    // This test would need a mechanism to advance time or a very short window for testing
    // For pragmatic MVP, this might be a manual check of config & one or two test calls.
    expect(true).toBe(true); // Placeholder
  });
});
```

**Frontend Security Review (Manual/Conceptual):**
-   Review React components rendering user content (PostCard, CommentCard, NoteCard) to ensure no direct HTML injection.
-   Check that `<a>` tags for external links have `rel="noopener noreferrer"`.

#### US-G027: Search Posts by Keyword (Backend & Frontend)
**As a user, I want to be able to enter keywords into a search bar, so that I can find posts relevant to my terms of interest.**

**Acceptance Criteria (Backend API - `GET /api/posts/search`):**
- [ ] API endpoint `GET /api/posts/search?q=keyword` is created.
- [ ] It accepts a query parameter `q` for the search keyword(s).
- [ ] Implements basic full-text search on the `content` field of the `posts` table using PostgreSQL's `to_tsvector` and `tsquery`.
- [ ] Search is case-insensitive.
- [ ] Returns a list of matching posts (structure similar to `GET /api/posts`), possibly with relevance scoring if supported by DB search.
- [ ] Returns an empty list if no posts match.
- [ ] Handles empty search queries gracefully (e.g., returns all posts or an empty list).
- [ ] A GIN index is added to `posts.content` for `to_tsvector` to improve performance.

**Acceptance Criteria (Frontend UI & Integration):**
- [ ] A search input field is available (e.g., in the `Header` or on the `FeedPage`).
- [ ] Typing in the search field and submitting (e.g., pressing Enter or clicking a search button) triggers a call to the backend search API.
- [ ] Search results are displayed in a clear format, similar to the main post feed (using `PostCard` components). This could be a new `/search-results` page or by filtering the existing `FeedPage`.
- [ ] A "No results found" message is displayed if no posts match the query.
- [ ] Basic loading and error states for the search operation are handled.

**Tests Required:**

**Backend Search API Tests:**
```javascript
// test/search/searchPosts.api.test.js
const request = require('supertest');
const app = require('../src/app');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { createTestUser, createTestPost } = require('../src/utils/testHelpers');

describe('GET /api/posts/search', () => {
  let user1;

  beforeAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    user1 = await createTestUser(pool, 'searchUser', 'search@example.com');
    await createTestPost(pool, user1.id, 'Post about a recent EXPLOSION in the city.', 10, 10);
    await createTestPost(pool, user1.id, 'Another post talking about city infrastructure.', 20, 20);
    await createTestPost(pool, user1.id, 'Discussion on urban planning and city growth.', 30, 30);
    // Add GIN index if not in migrations:
    // await pool.query("CREATE INDEX IF NOT EXISTS posts_content_fts_idx ON posts USING gin(to_tsvector('english', content));");
  });

  afterAll(async () => {
    await pool.query('TRUNCATE TABLE posts, users CASCADE');
    await pool.end();
  });

  test('should return posts matching a single keyword (case-insensitive)', async () => {
    const response = await request(app).get('/api/posts/search?q=explosion').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.posts.length).toBe(1);
    expect(response.body.posts[0].content).toContain('EXPLOSION');
  });

  test('should return posts matching multiple keywords', async () => {
    const response = await request(app).get('/api/posts/search?q=city+infrastructure').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.posts.length).toBe(1); // Only the second post
    expect(response.body.posts[0].content).toContain('city infrastructure');
  });
  
  test('should return multiple posts if keyword matches multiple', async () => {
    const response = await request(app).get('/api/posts/search?q=city').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.posts.length).toBe(2); // "city" is in post 1 and 3
  });

  test('should return an empty array if no posts match', async () => {
    const response = await request(app).get('/api/posts/search?q=nonexistentkeyword').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.posts.length).toBe(0);
  });

  test('should handle empty search query gracefully', async () => {
    const response = await request(app).get('/api/posts/search?q=').expect(200);
    expect(response.body.success).toBe(true);
    // Behavior for empty query can be all posts or empty. Let's assume empty for strict search.
    expect(response.body.posts.length).toBe(0); 
  });
});
```

**Frontend Search Integration Tests (RTL):**
```javascript
// test/frontend/Search.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { PostsProvider } from '../src/contexts/PostsContext';
import App from '../src/App'; // Assuming App contains Header with SearchInput and routes
import SearchResultsPage from '../src/pages/SearchResultsPage'; // Or integrated into FeedPage
import * as postsService from '../src/services/postsService';

jest.mock('../src/services/postsService');

const mockSearchResults = [
  { id: 10, content: 'Search result post 1: keyword', author: { username: 'searchauthor' }, created_at: new Date().toISOString() },
  { id: 11, content: 'Another result with keyword', author: { username: 'searchauthor2' }, created_at: new Date().toISOString() },
];

describe('Search Functionality', () => {
  const mockSearchPosts = postsService.searchPosts as jest.Mock;

  beforeEach(() => {
    mockSearchPosts.mockReset();
  });

  test('user can type in search bar and see search results', async () => {
    mockSearchPosts.mockResolvedValueOnce({ posts: mockSearchResults, pagination: { total: 2 } });
    
    render(
      <MemoryRouter initialEntries={['/feed']}> {/* Start on a page with search bar */}
        <AuthProvider>
          <PostsProvider>
            <App /> {/* Or a layout component containing the search bar */}
          </PostsProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search posts.../i); // Assuming placeholder
    await userEvent.type(searchInput, 'keyword');
    // Assuming search is triggered by pressing Enter or a search button
    // If it's on Enter:
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    // If it's a button:
    // const searchButton = screen.getByRole('button', { name: /search/i });
    // await userEvent.click(searchButton);

    await waitFor(() => {
      expect(mockSearchPosts).toHaveBeenCalledWith('keyword', expect.any(Object));
      // Assuming results are displayed on a new page or update the current one
      expect(screen.getByText('Search result post 1: keyword')).toBeInTheDocument();
      expect(screen.getByText('Another result with keyword')).toBeInTheDocument();
    });
  });

  test('displays "No results found" message for unsuccessful search', async () => {
    mockSearchPosts.mockResolvedValueOnce({ posts: [], pagination: { total: 0 } });
    render( /* ... as above ... */ <MemoryRouter initialEntries={['/feed']}><AuthProvider><PostsProvider><App /></PostsProvider></AuthProvider></MemoryRouter>);
    
    const searchInput = screen.getByPlaceholderText(/search posts.../i);
    await userEvent.type(searchInput, 'nomatch');
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText(/no posts found matching "nomatch"/i)).toBeInTheDocument();
    });
  });
});
```

---

### Sprint 12 Deliverables

**Backend Security:**
- [ ] `Helmet.js` configured for common security headers.
- [ ] Basic rate limiting reviewed/implemented on sensitive API endpoints (`express-rate-limit`).
- [ ] Review of user-generated content handling on backend to ensure proper sanitization practices if any rich text is processed (for MVP, likely plain text).
- [ ] Error responses reviewed to prevent info leakage.

**Frontend Security:**
- [ ] Review of how user-generated content is rendered in React components to prevent XSS.
- [ ] External links use `rel="noopener noreferrer"`.

**Search Functionality (Backend):**
- [ ] `GET /api/posts/search?q=keyword` API endpoint.
- [ ] PostgreSQL full-text search (`to_tsvector`, `tsquery`) implemented in `postService`.
- [ ] GIN index added to `posts.content` for `to_tsvector('english', content)`.

**Search Functionality (Frontend):**
- [ ] Search input field component (e.g., in `Header.tsx` or `FeedPage.tsx`).
- [ ] `postsService.ts` extended with `searchPosts(keyword, options)` function.
- [ ] Logic to display search results (either on a new `/search-results` page or by filtering the `FeedPage` display).
- [ ] UI for "No results found", loading, and error states for search.

**Testing:**
- [ ] Backend: Integration tests for security headers and rate limiting functionality.
- [ ] Backend: Integration tests for the search API endpoint (`GET /api/posts/search`).
- [ ] Frontend: Component tests for the search input field and search results display.
- [ ] Frontend: Unit tests for the `searchPosts` service function.

**Documentation:**
- [ ] Notes on security measures implemented.
- [ ] API documentation updated for the new search endpoint.

---

This completes Sprint 12 and "Month 5: Polish & Performance." Sprint 13 will focus on production deployment setup and basic monitoring.

---

## Sprint 13: Production Deployment Setup & Basic Monitoring (Weeks 25-26)

### Sprint Goal
The application is deployable to a production-like environment (single VPS) using Docker. Basic server-side logging and application health monitoring are in place. File storage is configured to use a cloud provider (e.g., S3) for production builds.

---

### User Stories & Acceptance Criteria

#### US-G028: Deploy Application to Production Environment (Developer/Operator)
**As a developer/operator, I want to be able to deploy the entire application (frontend, backend, database) to a single production Virtual Private Server using Docker, so that the application can be made accessible to initial users.**

**Acceptance Criteria:**
- [ ] Optimized `Dockerfile` for the backend Node.js application (multi-stage build, non-root user).
- [ ] Optimized `Dockerfile` for the frontend React application (serving static files via Nginx).
- [ ] `docker-compose.prod.yml` (or deployment scripts) for running backend, frontend (Nginx), and PostgreSQL on a single server in production mode.
- [ ] Environment variable management for production is documented and functional (e.g., using `.env` files excluded from git, or platform-specific secret management).
- [ ] Backend configured to use cloud file storage (e.g., AWS S3) when `NODE_ENV=production`. Local storage remains for development. S3 credentials managed via environment variables.
- [ ] Nginx configured as a reverse proxy for the backend API and to serve frontend static build files.
- [ ] Basic SSL/TLS setup for HTTPS using Let's Encrypt with Certbot (or cloud provider's SSL solution).
- [ ] Deployment process is documented.

**Tests Required (Manual Verification & Scripted Checks):**
-   **Docker Builds & Runs:**
    -   Build production Docker images for frontend and backend successfully.
    -   Run `docker-compose -f docker-compose.prod.yml up` locally (simulating VPS) and verify all services start and connect.
    -   Test core application functionality in this local production-like setup.
-   **S3 Integration (Staging/Test Environment):**
    -   Configure a test S3 bucket.
    -   Deploy the application to a staging environment with `NODE_ENV=production`.
    -   Manually test file uploads (e.g., post creation with an image) and verify files are stored in S3 and accessible.
    -   Verify local storage is used in development.
-   **Nginx & SSL (Staging/Test Environment):**
    -   Deploy to a staging VPS.
    -   Configure Nginx reverse proxy and static file serving.
    -   Install Let's Encrypt SSL certificate.
    -   Verify application is accessible via HTTPS and all routes work correctly.
    -   Check SSL certificate validity and configuration (e.g., using SSL Labs test).
```javascript
// test/deployment/docker.test.sh (Conceptual shell script for checks)
// #!/bin/bash
// echo "Building production backend image..."
// docker build -t osint-backend-prod -f backend/Dockerfile.prod backend/ || exit 1
// echo "Building production frontend image..."
// docker build -t osint-frontend-prod -f frontend/Dockerfile.prod frontend/ || exit 1
// echo "Running production compose file..."
// docker-compose -f docker-compose.prod.yml up -d --build || exit 1
// sleep 10 # Wait for services to start
// echo "Checking backend health..."
// curl -f http://localhost:3001/api/health || (docker-compose logs backend && exit 1) // Assuming port 3001 for backend
// echo "Checking frontend accessibility..."
// curl -f http://localhost:80 || (docker-compose logs frontend && exit 1) // Assuming Nginx on port 80
// echo "Docker deployment basic check successful."
// docker-compose -f docker-compose.prod.yml down
```

#### US-G029: Basic Production Logging (Developer/Operator)
**As a developer/operator, I want important application events and errors from the backend to be logged to files in a structured format (e.g., JSON) in the production environment, so that I can troubleshoot issues and monitor application activity.**

**Acceptance Criteria:**
- [ ] Backend logger (e.g., Winston) configured to output to log files (e.g., `/var/log/app/app.log`, `/var/log/app/error.log`) when `NODE_ENV=production`.
- [ ] Logs are in a structured format (JSON).
- [ ] Key events are logged: API requests (method, path, status code, response time), errors (with stack traces), user authentication events (login success/failure, registration).
- [ ] Log rotation is considered/configured to prevent disk space issues (e.g., using `logrotate` on the VPS).
- [ ] (Optional for MVP) Basic frontend error reporting configured (e.g., Sentry free tier for unhandled exceptions).

**Tests Required (Manual Verification & Log Inspection):**
-   Deploy to staging/production-like environment.
-   Perform various actions (API calls, trigger errors, user logins).
-   Inspect log files on the server to verify:
    -   Logs are being written to the correct files.
    -   Log format is structured JSON.
    -   Relevant information (timestamps, levels, messages, metadata) is present.
    -   Errors are logged with stack traces.
```javascript
// test/logging/logging.test.js (Conceptual - verify logger configuration)
const logger = require('../src/utils/logger'); // Assuming your Winston logger instance
const fs = require('fs');
const path = require('path');

describe('Production Logging', () => {
  const logFilePath = path.join(__dirname, '../../../logs/test_app.log'); // Adjust path

  beforeEach(() => {
    // Ensure log file doesn't exist or is empty
    if (fs.existsSync(logFilePath)) fs.unlinkSync(logFilePath);
    process.env.NODE_ENV = 'production'; // Simulate production
     // Re-initialize logger if it depends on NODE_ENV at import time
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test'; // Reset
    if (fs.existsSync(logFilePath)) fs.unlinkSync(logFilePath);
  });

  // This test is tricky as it involves file system interaction and logger internals.
  // More practical to manually verify on staging.
  // A unit test might check if the logger has the file transport in production.
  test('Winston logger should have file transport in production', () => {
    // This depends heavily on how your logger is configured.
    // You might check logger.transports array.
    const hasFileTransport = logger.transports.some(t => t.name === 'file'); // Or based on type
    if(process.env.NODE_ENV === 'production') { // Mocked above
        // expect(hasFileTransport).toBe(true);
    }
    expect(true).toBe(true); // Placeholder for more specific check or manual verification
  });
});
```

#### US-G030: Basic Application Health Monitoring (Developer/Operator)
**As a developer/operator, I want a simple way to check the health of the running backend application, so that I can quickly determine if the core services are operational.**

**Acceptance Criteria:**
- [ ] A health check API endpoint (e.g., `GET /api/health`) is implemented on the backend.
- [ ] The endpoint returns an HTTP 200 status if the application is healthy.
- [ ] The response body includes basic status information (e.g., `status: "OK"`, `database: "connected"`).
- [ ] (Optional) Basic server monitoring setup (e.g., using `htop`, `vmstat` on VPS, or a simple dashboard if VPS provider offers one).
- [ ] (Stretch Goal for MVP) Consider setting up a very simple uptime monitor (e.g., UptimeRobot free tier) pointing to the health check endpoint.

**Tests Required:**
```javascript
// test/health/healthcheck.api.test.js
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  test('should return 200 OK and status information when healthy', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'OK',
      message: 'Application is running',
      timestamp: expect.any(String), // Or Number for Date.now()
      database: 'connected', // Assuming DB connection is checked
      // Add other checks like Redis if applicable
    });
  });

  // Add test for unhealthy state if you implement detailed checks
  // e.g., mock DB down and expect database: "disconnected" and possibly non-200 status
});
```

---

### Sprint 13 Deliverables

**Deployment Infrastructure:**
- [ ] Production-optimized `Dockerfile` for backend (multi-stage, non-root user).
- [ ] Production-optimized `Dockerfile` for frontend (Nginx serving static build).
- [ ] `docker-compose.prod.yml` for running backend, frontend (Nginx), and PostgreSQL on a single VPS.
- [ ] Documentation on managing production environment variables (e.g., using `.env.production` not committed to git).
- [ ] Nginx configuration files for reverse proxy, static file serving, and basic SSL setup.

**Cloud Integration:**
- [ ] Backend logic to conditionally use AWS S3 (or chosen provider) for file storage in production mode.
- [ ] Configuration (via environment variables) for S3 bucket, access keys for production.

**Logging & Monitoring:**
- [ ] Backend logger (e.g., Winston) configured for structured file logging in production (e.g., JSON format, log rotation considerations).
- [ ] Key backend events (API requests, errors, auth events) are logged.
- [ ] `GET /api/health` endpoint on the backend returning application health status (including DB connectivity).
- [ ] (Optional) Basic setup for frontend error reporting (e.g., Sentry free tier).
- [ ] (Optional) Basic server/application monitoring tool setup (e.g., UptimeRobot for health endpoint, VPS provider's dashboard).

**Documentation:**
- [ ] Detailed step-by-step guide for deploying the application to a single VPS using Docker and Nginx.
- [ ] Initial draft of a pre-launch checklist (verifying env vars, backups, SSL, etc.).

**Testing:**
- [ ] Manual E2E testing of the deployment process on a staging/test VPS.
- [ ] Verification of S3 integration in a production-like environment.
- [ ] Verification of Nginx configuration and SSL setup.
- [ ] Inspection of production logs to ensure correct format and content.
- [ ] Automated tests for the `/api/health` endpoint.

---

This sprint makes the application deployable and monitorable in a basic production setting. Sprint 14 will be the final sprint, focusing on final testing and a soft launch.

---

## Sprint 14: Final Testing, Soft Launch & Initial Monitoring (Weeks 27-28)

### Sprint Goal
The OSINT platform MVP is successfully soft-launched to a small, controlled group of beta testers on the production environment. The system is verified to be stable, core functionalities are confirmed live, and an initial feedback loop with early users is established. Critical monitoring is active and reviewed.

---

### User Stories & Acceptance Criteria

#### US-G031: Access Production Platform via Domain (Beta Tester)
**As a beta tester, I want to be able to access the live OSINT platform using its official domain name over a secure HTTPS connection, so that I can begin testing its features in a real-world environment.**

**Acceptance Criteria:**
- [ ] The official domain name for the platform is registered and configured.
- [ ] DNS records are correctly pointing the domain to the production VPS IP address.
- [ ] The SSL certificate (e.g., Let's Encrypt) is correctly installed and configured for the domain, ensuring HTTPS is enforced.
- [ ] Navigating to the domain in a browser successfully loads the application over HTTPS.
- [ ] Beta testers can register, log in, and interact with all MVP features on the live production environment.

**Tests Required (Manual Verification & External Tools):**
-   **Domain & DNS:**
    -   Use `nslookup` or online DNS checker tools to verify DNS propagation.
    -   Manually access the platform via `http://yourdomain.com` and verify redirection to `https://yourdomain.com`.
-   **SSL Certificate:**
    -   Check browser security indicators (padlock icon).
    -   Use online SSL checkers (e.g., SSL Labs' SSL Test) to verify certificate validity, chain, and server configuration.
-   **Application Functionality:**
    -   Execute a predefined checklist of core user flows on the live production domain by a member of the dev team before inviting beta testers.

#### US-G032: Provide Feedback & Report Bugs (Beta Tester)
**As a beta tester, I want to have a clear and easy way to report any bugs I find or provide feedback on my user experience, so that I can help improve the platform.**

**Acceptance Criteria:**
- [ ] A dedicated feedback channel is established and communicated to beta testers (e.g., private Discord, shared Google Form/Sheet, dedicated email).
- [ ] Beta testers are provided with guidelines on what to test and how to report issues (e.g., steps to reproduce, browser version, screenshots).
- [ ] A system (even if manual initially, like a Trello board or spreadsheet) is in place for the development team to track, prioritize, and manage feedback and bug reports from beta testers.
- [ ] Acknowledgement is sent to beta testers for their submissions.

**Process Verification (Internal Team):**
-   Internally test the feedback submission process.
-   Verify the bug tracking system correctly captures reports.

#### US-G033: Monitor Live Application Health (Developer/Operator)
**As a developer/operator, I want to actively monitor the health, performance, and error logs of the live application during the soft launch, so that I can quickly identify and respond to any critical issues.**

**Acceptance Criteria:**
- [ ] Backend application logs (info, errors) are being regularly reviewed.
- [ ] Nginx access and error logs are being monitored for anomalies.
- [ ] Server resource utilization (CPU, memory, disk, network) on the VPS is actively monitored (e.g., using `htop`, `vmstat`, or provider's dashboard).
- [ ] The `/api/health` endpoint is periodically checked (manually or via uptime monitor).
- [ ] Frontend error reporting service (if set up in Sprint 13) dashboard is monitored.
- [ ] A process is defined for prioritizing and addressing critical bugs or performance issues discovered during the soft launch.
- [ ] Key performance indicators (e.g., API response times for critical endpoints, page load times for main pages) are informally benchmarked under initial user load.

**Monitoring Setup Verification (Internal Team):**
-   Trigger test errors and verify they appear in logs/error reporting.
-   Simulate load on an endpoint and observe resource utilization.
-   Verify uptime monitor (if used) correctly reports health status.

#### US-G034: Initial User Guidance (Beta Tester/New User)
**As a new user or beta tester, I want to be able to find basic information on how to use the platform's core features or answers to common questions, so that I can get started more easily.**

**Acceptance Criteria:**
- [ ] A basic FAQ or "Getting Started" guide is drafted and published (e.g., a simple Markdown file in a public repo, a Notion page, or a static page on the platform).
- [ ] The guide covers core functionalities: registration, login, creating a post (including geotagging), viewing the feed/map, understanding community notes, and submitting feedback.
- [ ] The guide is easily accessible to beta testers.

**Content Verification (Internal Team):**
-   Review the FAQ/Guide for clarity, accuracy, and completeness regarding MVP features.
-   Ensure links to the guide are provided to beta testers.

---

### Sprint 14 Deliverables

**Pre-Launch & Launch Activities:**
- [ ] Comprehensive end-to-end testing completed on the production-like environment, all critical bugs fixed.
- [ ] Domain name registered and DNS configured for the production VPS.
- [ ] SSL certificate (Let's Encrypt) installed, configured, and verified for HTTPS.
- [ ] Final execution of the pre-launch checklist (from Sprint 13).
- [ ] Soft launch conducted with a selected group of 10-50 beta testers.

**Feedback & Monitoring:**
- [ ] Dedicated feedback channels for beta testers established and active.
- [ ] System for tracking and prioritizing beta tester feedback and bug reports implemented.
- [ ] Active monitoring of production server logs (Nginx, backend app), server resources, and application health endpoint.
- [ ] (Optional) Frontend error reporting dashboard monitored.

**Issue Resolution:**
- [ ] Process for rapid bug fixing and hotfix deployment (if needed) tested and ready.
- [ ] Critical issues reported during soft launch are addressed promptly.

**Documentation & Review:**
- [ ] Basic FAQ or "Getting Started" guide for users drafted and published.
- [ ] Internal review and retrospective of the soft launch process, documenting lessons learned, bugs found, and user feedback themes.
- [ ] Initial assessment of platform stability and usability based on soft launch.
- [ ] Plan for next steps post-MVP (e.g., wider public launch, addressing feedback, next feature priorities).

**Testing:**
- [ ] Documented results of final E2E testing.
- [ ] List of bugs identified and resolved during the soft launch period.
- [ ] Manual verification of domain, DNS, and SSL configurations.
- [ ] Confirmation that monitoring tools are operational and providing data.

---

This concludes the 14-sprint (7-month) development plan for the pragmatic OSINT Platform MVP. The platform is now soft-launched, stable (hopefully!), and has received its first round of real-user feedback, paving the way for a wider public release and future iterations.