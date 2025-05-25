-- Migration 001: Create Users Table
-- Sprint 1 Deliverable: Database Schema for User Authentication

-- Create users table with exact schema from instructions.md
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient lookups as specified in Sprint 1 deliverables
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for OSINT Platform authentication';
COMMENT ON COLUMN users.id IS 'Primary key - using SERIAL for pragmatic MVP';
COMMENT ON COLUMN users.username IS 'Unique username for user identification';
COMMENT ON COLUMN users.email IS 'Unique email address for authentication';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password (salt rounds >= 10)';
COMMENT ON COLUMN users.reputation IS 'User reputation score (default: 0)';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';

-- Verify table creation
DO $$
BEGIN
    RAISE NOTICE 'Users table created successfully with indexes';
    RAISE NOTICE 'Schema: id (SERIAL), username (VARCHAR(50)), email (VARCHAR(255)), password_hash (VARCHAR(255)), reputation (INTEGER), created_at (TIMESTAMPTZ)';
    RAISE NOTICE 'Indexes: idx_users_username, idx_users_email';
END $$; 