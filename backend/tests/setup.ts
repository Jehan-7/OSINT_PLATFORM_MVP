import dotenv from 'dotenv';
import path from 'path';

// Set test environment first
process.env.NODE_ENV = 'test';

// Load test environment variables (fallback to defaults if file doesn't exist)
dotenv.config({ path: path.join(__dirname, '..', 'env.test') });

// Set default test environment variables if not provided
if (!process.env.PORT) process.env.PORT = '3002';
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'postgresql://osint_user:osint_password@localhost:5432/osint_platform_test';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-jwt-secret-key';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '1h';
if (!process.env.BCRYPT_SALT_ROUNDS) process.env.BCRYPT_SALT_ROUNDS = '4';
if (!process.env.RATE_LIMIT_WINDOW_MS) process.env.RATE_LIMIT_WINDOW_MS = '60000';
if (!process.env.RATE_LIMIT_MAX_REQUESTS) process.env.RATE_LIMIT_MAX_REQUESTS = '1000';

// Increase timeout for database operations
jest.setTimeout(15000); 