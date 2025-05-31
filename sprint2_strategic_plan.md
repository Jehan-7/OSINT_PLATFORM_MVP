# STRATEGIC IMPLEMENTATION PLAN FOR CURSOR AI
## Sprint 2: Core Post Functionality & Basic API Structure

### CONTEXT FOR CURSOR:
You are implementing the core post functionality for the OSINT Platform MVP. This is **Sprint 2** from @instructions.md, building upon the **rock-solid Sprint 1 foundation** with 84/84 tests passing. The goal is creating production-ready post creation and retrieval APIs with geospatial support while maintaining the proven architectural patterns.

### ARCHITECTURAL REQUIREMENTS:
- **Foundation**: Build on Sprint 1's proven service layer pattern and security model
- **Database**: Posts table with geospatial coordinates using separate latitude/longitude columns
- **Authentication**: JWT-protected creation, public read access
- **Geospatial**: Basic coordinate validation with PostGIS foundation ready for future enhancement
- **Testing**: Maintain 100% test success rate with comprehensive TDD approach

---

## IMPLEMENTATION STRATEGY

### PHASE 1: Database Foundation & Post Schema
**Goal**: Establish posts table with proper relationships, indexes, and geospatial readiness

**Key Deliverables**:
1. **Posts Table Migration**: Create table with foreign key to users, geospatial columns, proper constraints
2. **Performance Indexes**: Optimize for common queries (author lookup, creation date, location ranges)
3. **Database Service Extension**: Add posts-specific query methods following Sprint 1 patterns
4. **Schema Testing**: Comprehensive database tests proving table structure and relationships

**Critical Design Decisions**:
- **Geospatial Implementation**: Separate `latitude DECIMAL(10,8)` and `longitude DECIMAL(11,8)` columns for MVP simplicity
- **Content Constraints**: 1000 character limit for focused, concise intelligence reports
- **Foreign Key**: `author_id` references `users(id)` with CASCADE delete for data integrity
- **Performance**: Strategic indexes on `author_id`, `created_at DESC`, and location columns

**Success Criteria**:
- Posts table created with all constraints and indexes
- Foreign key relationship to users working properly
- Database tests validate schema structure and performance
- PostGIS foundation remains available for future enhancement

**Git Checkpoint**: Commit working database schema with passing tests

---

### PHASE 2: Post Service Layer & Business Logic
**Goal**: Build robust service layer following Sprint 1's proven service patterns

**Service Architecture**:
- **PostService Class**: Singleton pattern matching `PasswordService`/`JWTService` structure
- **CRUD Operations**: Create, fetch single, fetch paginated list with author information
- **Geospatial Validation**: Coordinate range validation (lat: -90 to 90, lng: -180 to 180)
- **Author Integration**: Fetch posts with user information without exposing sensitive data

**Technical Specifications**:
- **Content Validation**: 1000 character limit with XSS prevention
- **Coordinate Validation**: Strict range checking with meaningful error messages
- **Pagination Logic**: 20 posts per page default, configurable with offset/limit
- **Author Information**: Include `{id, username, reputation}` but never email/password_hash
- **Transaction Support**: Use database transactions for complex operations

**Success Criteria**:
- All service methods work with comprehensive input validation
- Proper error handling with consistent error messages
- Author information properly joined without security leaks
- Pagination working correctly with proper edge case handling

**Git Checkpoint**: Commit complete service layer with passing unit tests

---

### PHASE 3: Post Validation & Input Sanitization
**Goal**: Extend Sprint 1's validation patterns for post-specific requirements

**Validation Requirements**:
- **Content Validation**: 1000 char limit, XSS prevention, required field checking
- **Geospatial Validation**: Latitude/longitude range validation with error messages
- **Location Name**: Optional field validation with sanitization
- **Security Checks**: Prevent injection attacks and malicious content

**Following Sprint 1 Patterns**:
- **ValidationResult Interface**: Consistent `{isValid, errors}` structure
- **Comprehensive Error Messages**: Specific, helpful validation errors
- **Input Sanitization**: Remove dangerous content while preserving legitimate text
- **Edge Case Handling**: Null, undefined, empty string, type validation

**Success Criteria**:
- All validation functions follow established patterns
- Comprehensive test coverage for all edge cases
- Security validation prevents common attack vectors
- Error messages are helpful and user-friendly

**Git Checkpoint**: Commit validation utilities with comprehensive test coverage

---

### PHASE 4: Post Controllers & HTTP Logic
**Goal**: Create controllers following `AuthController` patterns with proper HTTP handling

**Controller Architecture**:
- **PostController Class**: Match `AuthController` structure and error handling
- **HTTP Methods**: POST for creation, GET for retrieval (single & list)
- **Authentication Integration**: JWT middleware for protected endpoints
- **Response Formatting**: Consistent with Sprint 1's response patterns

**API Endpoints**:
- **POST /api/posts**: JWT-protected post creation with full validation
- **GET /api/posts**: Public paginated list with query parameters
- **GET /api/posts/:id**: Public single post retrieval with author information
- **Error Handling**: Consistent HTTP status codes (400, 401, 404, 500)

**Security Implementation**:
- **Rate Limiting**: Prevent spam posting and abuse
- **Input Validation**: Server-side validation for all inputs
- **Authentication**: JWT verification for post creation
- **Error Responses**: Generic messages preventing information leakage

**Success Criteria**:
- All endpoints working with proper HTTP status codes
- JWT authentication working for protected endpoints
- Error handling consistent with Sprint 1 patterns
- Response format matches established conventions

**Git Checkpoint**: Commit working controllers with integration tests

---

### PHASE 5: API Routes & Middleware Integration
**Goal**: Create route structure matching Sprint 1's `auth.ts` patterns

**Route Configuration**:
- **Modular Structure**: Separate `/api/posts` route file following auth route patterns
- **Middleware Stack**: Rate limiting, JWT authentication, input validation
- **HTTP Method Mapping**: Proper REST conventions with clear route documentation
- **Error Middleware**: Global error handling integration

**Rate Limiting Strategy**:
- **Post Creation**: Stricter limits to prevent spam (similar to registration rate limiting)
- **Read Operations**: More lenient limits for public post access
- **Authentication-Based**: Different limits for authenticated vs anonymous users

**Success Criteria**:
- Routes properly integrated with Express app
- Rate limiting working as configured
- JWT middleware protecting creation endpoint
- All routes documented with proper JSDoc comments

**Git Checkpoint**: Commit complete route integration

---

### PHASE 6: Comprehensive Testing & Integration
**Goal**: Achieve 100% test success rate maintaining Sprint 1's testing excellence

**Testing Strategy**:
1. **Database Tests**: Schema validation, relationship integrity, index performance
2. **Service Tests**: Business logic, validation, error handling, edge cases
3. **Controller Tests**: HTTP logic, authentication, response formatting
4. **Integration Tests**: Full API endpoint testing with realistic scenarios
5. **Security Tests**: Rate limiting, authentication, input validation

**Test Coverage Requirements**:
- **Database Layer**: Schema tests, constraint validation, query performance
- **Service Layer**: All CRUD operations, validation logic, error scenarios
- **Controller Layer**: All HTTP endpoints, authentication, error responses
- **Integration**: Full user workflows, pagination, geospatial features

**Following Sprint 1 Excellence**:
- **TDD Approach**: Failing tests first, then minimal implementation
- **Comprehensive Coverage**: 80%+ test coverage maintained
- **Edge Case Testing**: Null, undefined, invalid types, boundary conditions
- **Security Testing**: Authentication, rate limiting, input validation

**Success Criteria**:
- All tests passing (maintaining Sprint 1's 100% success rate)
- Test coverage meets or exceeds 80% threshold
- All edge cases and error scenarios covered
- Security vulnerabilities tested and prevented

**Final Git Checkpoint**: Commit complete Sprint 2 deliverable with documentation

---

## IMPLEMENTATION APPROACH FOR CURSOR:

### Sprint 1 Proven TDD Workflow:
1. **Database First**: Start with failing schema tests, implement migration
2. **Service Layer**: Write failing service tests, implement business logic
3. **Validation**: Create failing validation tests, implement security checks
4. **Controllers**: Write failing API tests, implement HTTP handlers
5. **Integration**: Full end-to-end testing with realistic scenarios

### Security-First Implementation:
- **Every Input Validated**: Follow Sprint 1's comprehensive validation patterns
- **Authentication Required**: JWT verification for all write operations
- **Rate Limiting**: Prevent abuse while allowing legitimate usage
- **Error Handling**: Generic responses preventing information leakage

### Performance Considerations:
- **Database Indexes**: Strategic indexing for common query patterns
- **Pagination**: Efficient offset/limit implementation with count optimization
- **Connection Pooling**: Leverage Sprint 1's database service efficiency
- **Query Optimization**: Use EXPLAIN ANALYZE for performance verification

---

## SUCCESS VALIDATION:

### Sprint 2 Completion Criteria:
```bash
# All tests pass (maintaining 100% success rate)
cd backend && npm test

# Database schema properly created
docker-compose exec postgres psql -U osint_user -d osint_platform_dev -c "\d posts;"

# API endpoints working
curl -X POST http://localhost:3001/api/posts \
  -H "Authorization: Bearer <valid-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test post","latitude":40.7829,"longitude":-73.9654}'

curl http://localhost:3001/api/posts
curl http://localhost:3001/api/posts/1
```

### Database Schema Validation:
```sql
-- Posts table with proper constraints
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
    latitude DECIMAL(10, 8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(11, 8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    location_name VARCHAR(255),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at_desc ON posts(created_at DESC);
CREATE INDEX idx_posts_location ON posts(latitude, longitude);
```

### API Response Validation:
```typescript
// POST /api/posts (201 Created)
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "id": 1,
    "content": "Sample intelligence report",
    "latitude": 40.7829,
    "longitude": -73.9654,
    "location_name": "Central Park",
    "author": {
      "id": 1,
      "username": "analyst_user",
      "reputation": 150
    },
    "upvotes": 0,
    "downvotes": 0,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}

// GET /api/posts (200 OK)
{
  "success": true,
  "posts": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## TECHNICAL SPECIFICATIONS:

### Geospatial Implementation:
- **Coordinate Storage**: Separate DECIMAL columns for MVP simplicity
- **Validation**: Strict latitude (-90 to 90) and longitude (-180 to 180) checking
- **PostGIS Ready**: Foundation prepared for future POINT geometry upgrade
- **Index Strategy**: Composite index on lat/lng for range queries

### Security Implementation:
- **Authentication**: JWT verification following Sprint 1 patterns
- **Rate Limiting**: Tiered limits (creation vs read operations)
- **Input Validation**: Multi-layer validation (client, server, database)
- **Error Handling**: Generic responses preventing enumeration attacks

### Performance Optimization:
- **Database Indexes**: Strategic indexing for query patterns
- **Pagination**: Efficient implementation with count optimization
- **Connection Management**: Leverage Sprint 1's pooling configuration
- **Response Optimization**: Include only necessary author information

---

**Cursor: Begin with Phase 1 (Database Foundation). Create the failing database tests first, then implement the posts table migration following Sprint 1's proven patterns. Work incrementally, commit after each working phase, and maintain the 100% test success rate that made Sprint 1 excellent.**

**Remember**: You're building on a **production-ready foundation** with 84/84 tests passing. Maintain that excellence while adding powerful geospatial post functionality! 🚀