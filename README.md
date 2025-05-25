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

## 📋 Sprint 1 Status

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

- **Testing Framework**
  - Jest + Supertest integration testing
  - TypeScript support
  - Test environment configuration
  - Health endpoint tests (3/3 passing)

### 🔧 Architecture

```
OSINT_Platform_MVP/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   └── app.ts          # Express application setup
│   ├── tests/              # Test suites
│   ├── Dockerfile          # Multi-stage Docker build
│   └── package.json        # Dependencies and scripts
├── database/
│   └── init/               # Database initialization scripts
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

# Run database migrations (future sprints)
# npm run migrate
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
cd backend && npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- **Health Check Tests**: Verify API endpoint functionality
- **Integration Tests**: Test API endpoints with Supertest
- **Unit Tests**: Test individual functions and services

## 🌍 Environment Configuration

### Development (.env)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://osint_user:osint_password@localhost:5432/osint_platform_dev
JWT_SECRET=dev-jwt-secret-key
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Environment

Environment variables are configured in `docker-compose.yml` for containerized development.

## 📊 API Endpoints

### Health Check

- **GET** `/api/health`
  - Returns server health status
  - Response: `{"success": true, "status": "healthy", "timestamp": "...", "uptime": 123.45, "environment": "development"}`

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Joi schema validation (future sprints)
- **JWT Authentication**: Token-based auth (future sprints)

## 🗄️ Database

### PostgreSQL with PostGIS

- **Version**: PostgreSQL 15 with PostGIS 3.3
- **Extensions**: PostGIS, PostGIS Topology
- **Connection Pool**: Configured for optimal performance
- **Health Checks**: Automatic service monitoring

### Future Schema (Sprint 1+)

- Users table with authentication
- Posts table with geospatial data
- Community notes and voting system

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
```

## 🔄 Development Workflow

1. **Make changes** to source code in `backend/src/`
2. **Run tests** to ensure functionality: `npm test`
3. **Test in Docker** environment: `docker-compose up --build`
4. **Commit changes** with conventional commit messages
5. **Push to repository** for team collaboration

## 📈 Next Steps (Sprint 2+)

- User authentication and registration APIs
- Post creation with geospatial data
- Community notes and voting system
- Frontend React application
- Advanced search and filtering
- Real-time notifications

## 🤝 Contributing

1. Follow TDD (Test-Driven Development) approach
2. Write tests before implementing features
3. Use conventional commit messages
4. Ensure all tests pass before committing
5. Update documentation for new features

## 📝 License

This project is licensed under the MIT License.

---

**Sprint 1 Complete** ✅ | **Next**: User Authentication APIs (Sprint 2) 