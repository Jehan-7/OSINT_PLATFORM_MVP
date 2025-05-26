# OSINT Platform MVP

A comprehensive Open Source Intelligence (OSINT) platform for collecting, analyzing, and sharing geospatial intelligence data.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OSINT_Platform_MVP
   ```

2. **Start the development environment**
   ```bash
   docker-compose up --build
   ```

3. **Verify the setup**
   - Backend API: http://localhost:3001/api/health
   - PostgreSQL: localhost:5432 (user: osint_user, password: osint_password)

## 📋 Sprint 2 Status - COMPLETE ✅

### ✅ Sprint 1 Foundation (Previously Completed)
- **Authentication System**: User registration, login, JWT tokens
- **Database Infrastructure**: PostgreSQL + PostGIS, users table
- **Testing Framework**: 84/84 tests passing
- **Docker Environment**: Full development setup

### ✅ Sprint 2: Core Post Functionality (NEW)

- **Posts Database Schema**
  - Posts table with geospatial support (PostGIS)
  - Foreign key relationships to users
  - Geospatial indexes and performance optimization
  - Database constraints and triggers

- **Post Management API**
  - `POST /api/v1/posts` - Create geotagged posts (JWT protected)
  - `GET /api/v1/posts` - List posts with pagination (public)
  - `GET /api/v1/posts/:id` - Get specific post (public)
  - `GET /api/v1/users/:userId/posts` - User's posts (public)

- **Advanced Features**
  - Geospatial coordinate validation (lat: -90 to 90, lng: -180 to 180)
  - Content sanitization and XSS prevention
  - Pagination with configurable limits
  - Author information in post responses
  - PostgreSQL performance optimization

- **Testing & Quality**
  - **100+ tests passing** across all Sprint 2 components
  - Service layer testing (37 tests)
  - Controller testing (23 tests)
  - HTTP integration testing (14 tests)
  - Database schema testing (13 tests)

### 🔧 Architecture

```
OSINT_Platform_MVP/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── controllers/    # API controllers (AuthController)
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers (auth routes)
│   │   ├── services/       # Business logic services (JWT, Password, Database)
│   │   ├── utils/          # Validation utilities
│   │   └── app.ts          # Express application setup
│   ├── tests/              # Test suites (unit + integration)
│   ├── Dockerfile          # Multi-stage Docker build
│   └── package.json        # Dependencies and scripts
├── database/
│   ├── init/               # Database initialization scripts
│   └── migrations/         # Database migration files
├── docker-compose.yml      # Development environment
└── README.md
```

## 🛠️ Development Commands

### Docker Commands

```bash
# Start development environment
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs backend
docker-compose logs postgres

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build --force-recreate
```

### Local Development

```bash
# Install dependencies
cd backend && npm install

# Run tests
npm test

# Run specific test file
npm test -- tests/integration/auth.test.ts

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

### Database Commands

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U osint_user -d osint_platform_dev

# Test PostGIS
docker-compose exec postgres psql -U osint_user -d osint_platform_dev -c "SELECT PostGIS_Version();"

# Check users table
docker-compose exec postgres psql -U osint_user -d osint_platform_dev -c "SELECT * FROM users;"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests (100+ tests)
cd backend && npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm test -- tests/services/
npm test -- tests/integration/
npm test -- tests/database/
npm test -- tests/controllers/
```

### Test Structure (Sprint 1 + 2)

- **Health Check Tests**: Verify API endpoint functionality (3 tests)
- **Database Tests**: Schema validation and operations (13 tests Sprint 1+2)
- **Service Tests**: JWT, Password, and Post services (44 + 37 = 81 tests)
- **Controller Tests**: Authentication and Post controllers (23 tests)
- **Integration Tests**: HTTP endpoint testing (29 + 14 = 43 tests)
- **Total**: **100+ tests passing ✅** across all Sprint 2 components

## 🌍 Environment Configuration

### Development (.env)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://osint_user:osint_password@localhost:5432/osint_platform_dev
JWT_SECRET=dev-jwt-secret-key-that-is-at-least-32-characters-long
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Test Environment (.env.test)

```env
NODE_ENV=test
PORT=3002
DATABASE_URL=postgresql://osint_user:osint_password@localhost:5433/osint_platform_test
JWT_SECRET=test-jwt-secret-key-that-is-at-least-32-characters-long-for-security
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=4
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 📊 API Endpoints

### Health Check

- **GET** `/api/health`
  - Returns server health status
  - Response: `{"success": true, "status": "healthy", "timestamp": "...", "uptime": 123.45, "environment": "development"}`

### Authentication (Sprint 1 ✅)

- **POST** `/api/auth/register`
  - Register a new user account
  - Body: `{"username": "string", "email": "string", "password": "string"}`
  - Returns: User data + JWT token
  - Validation: Username (3-50 chars), Email (valid format), Password (8+ chars with complexity)
  - Rate Limited: 3 attempts per hour per IP

- **POST** `/api/auth/login`
  - Authenticate user and return JWT token
  - Body: `{"email": "string", "password": "string"}`
  - Returns: User data + JWT token
  - Validation: Email format, Password presence
  - Rate Limited: 5 attempts per 15 minutes per IP
  - Security: Generic error messages to prevent enumeration

### Posts Management (Sprint 2 ✅)

- **POST** `/api/v1/posts`
  - Create a new geotagged post (requires JWT authentication)
  - Headers: `Authorization: Bearer JWT_TOKEN`
  - Body: `{"content": "string", "latitude": number, "longitude": number, "location_name": "string"}`
  - Validation: Content (1-1000 chars), Lat (-90 to 90), Lng (-180 to 180)
  - Returns: Created post with author information
  - Response: `{"success": true, "message": "Post created successfully", "data": {...}}`

- **GET** `/api/v1/posts`
  - List posts with pagination (public access)
  - Query params: `?page=1&limit=20` (limit max: 100)
  - Returns: Paginated posts with author information
  - Response: `{"success": true, "data": {"posts": [...], "pagination": {...}}}`

- **GET** `/api/v1/posts/:id`
  - Get a specific post by ID (public access)
  - Returns: Single post with author information
  - Response: `{"success": true, "data": {...}}`

- **GET** `/api/v1/users/:userId/posts`
  - Get posts by specific user (public access)
  - Query params: `?page=1&limit=20`
  - Returns: User's posts with pagination
  - Response: `{"success": true, "data": {"posts": [...], "pagination": {...}}}`

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling (registration: 3/hour, auth: 5/15min)
- **Input Validation**: Comprehensive validation with sanitization
- **JWT Authentication**: HS256 algorithm with proper expiration
- **Password Security**: bcrypt with salt rounds ≥ 10
- **SQL Injection Prevention**: Prepared statements
- **XSS Protection**: Input sanitization

## 🗄️ Database

### PostgreSQL with PostGIS

- **Version**: PostgreSQL 15 with PostGIS 3.3
- **Extensions**: PostGIS, PostGIS Topology
- **Connection Pool**: Configured for optimal performance
- **Health Checks**: Automatic service monitoring

### Schema (Sprint 1 + 2 ✅)

```sql
-- Users table (Sprint 1)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (Sprint 2)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 1000),
    latitude DECIMAL(10,8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(11,8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    location_name VARCHAR(255),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_location ON posts USING GIST(ST_Point(longitude, latitude));
```

## 🚦 Health Monitoring

### Application Health

- **Endpoint**: `/api/health`
- **Docker Health Check**: Automatic container monitoring
- **Database Connectivity**: Connection pool monitoring

### Service Status

```bash
# Check service status
docker-compose ps

# View health check logs
docker-compose logs backend | grep health

# Test registration endpoint
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"SecurePass123!"}'
```

## 🔄 Development Workflow

1. **Make changes** to source code in `backend/src/`
2. **Write tests first** (TDD approach)
3. **Run tests** to ensure functionality: `npm test`
4. **Test in Docker** environment: `docker-compose up --build`
5. **Commit changes** with conventional commit messages
6. **Push to repository** for team collaboration

## 📈 Next Steps (Sprint 3)

Based on instructions.md, Sprint 3 will focus on:

- **Frontend Setup**: React 18 + TypeScript + Vite + Tailwind CSS
- **Authentication UI**: Registration and login forms
- **JWT Integration**: Frontend token storage and management
- **Basic Routing**: Client-side navigation setup
- **Post Display**: Connect frontend to existing post APIs

## 🤝 Contributing

1. Follow TDD (Test-Driven Development) approach
2. Write tests before implementing features
3. Use conventional commit messages
4. Ensure all tests pass before committing
5. Update documentation for new features
6. Maintain 80%+ test coverage

## 📝 License

This project is licensed under the MIT License.

---

**Sprint 2 Complete** ✅ | **100+ Tests Passing** | **4 New API Endpoints** | **Next**: Frontend Setup (Sprint 3)
