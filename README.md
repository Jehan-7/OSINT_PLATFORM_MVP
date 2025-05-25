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

## 📋 Sprint 1 Status - COMPLETE ✅

### ✅ Completed Features

- **Dockerized Development Environment**
  - PostgreSQL 15 with PostGIS extensions
  - Node.js/Express backend with TypeScript
  - Hot reloading for development
  - Health monitoring and graceful shutdown

- **Backend Infrastructure**
  - Express.js application with security middleware
  - Environment variable configuration
  - Global error handling
  - Rate limiting and CORS support

- **Database Schema & Services**
  - Users table with proper constraints and indexes
  - Database service with connection pooling
  - JWT and Password services with security
  - All database tests passing (8/8)

- **Authentication API - COMPLETE**
  - User registration endpoint with comprehensive validation
  - User login endpoint with secure authentication
  - Input validation utility with security rules
  - Rate limiting for authentication endpoints
  - Duplicate checking for username/email
  - Password hashing with bcrypt (salt rounds ≥ 10)
  - JWT token generation and validation
  - Secure password verification and error handling

- **Testing Framework**
  - Jest + Supertest integration testing
  - TypeScript support
  - Test environment configuration
  - **84/84 tests passing (100% success rate)**
  - Comprehensive test coverage for all features
  - Complete authentication flow testing

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
# Run all tests (74 tests)
cd backend && npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm test -- tests/services/
npm test -- tests/integration/
npm test -- tests/database/
```

### Test Structure

- **Health Check Tests**: Verify API endpoint functionality (3 tests)
- **Database Tests**: Schema validation and operations (8 tests)
- **Service Tests**: JWT and Password services (44 tests)
- **Integration Tests**: Authentication API endpoints (19 tests)
- **Total**: 74/74 tests passing ✅

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

- **POST** `/api/auth/refresh` (Placeholder - Sprint 2)
- **POST** `/api/auth/logout` (Placeholder - Sprint 2)

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

### Schema (Sprint 1 ✅)

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
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

## 📈 Next Steps (Sprint 2)

- **Login API**: User authentication with JWT
- **Protected Routes**: Middleware for authentication
- **Token Refresh**: JWT token renewal
- **User Profile**: Get/update user information
- **Password Reset**: Forgot password functionality

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

**Sprint 1 Complete** ✅ | **74/74 Tests Passing** | **Next**: Login API & Protected Routes (Sprint 2)
