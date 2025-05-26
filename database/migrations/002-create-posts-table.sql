-- Migration 002: Create Posts Table
-- Sprint 2 Deliverable: Database Schema for Post Functionality with Geospatial Support

-- Create posts table with exact schema from Sprint 2 requirements
CREATE TABLE IF NOT EXISTS posts (
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

-- Create performance indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(latitude, longitude);

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on UPDATE
CREATE TRIGGER posts_updated_at_trigger
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE posts IS 'Posts table for OSINT Platform with geospatial coordinates';
COMMENT ON COLUMN posts.id IS 'Primary key - using SERIAL for pragmatic MVP';
COMMENT ON COLUMN posts.author_id IS 'Foreign key to users table (CASCADE delete)';
COMMENT ON COLUMN posts.content IS 'Post content (max 1000 characters)';
COMMENT ON COLUMN posts.latitude IS 'Latitude coordinate (-90 to 90 degrees)';
COMMENT ON COLUMN posts.longitude IS 'Longitude coordinate (-180 to 180 degrees)';
COMMENT ON COLUMN posts.location_name IS 'Optional human-readable location name';
COMMENT ON COLUMN posts.upvotes IS 'Number of upvotes (default: 0)';
COMMENT ON COLUMN posts.downvotes IS 'Number of downvotes (default: 0)';
COMMENT ON COLUMN posts.created_at IS 'Post creation timestamp';
COMMENT ON COLUMN posts.updated_at IS 'Post last update timestamp (auto-updated)';

-- Verify table creation
DO $$
BEGIN
    RAISE NOTICE 'Posts table created successfully with constraints and indexes';
    RAISE NOTICE 'Schema: id (SERIAL), author_id (INTEGER FK), content (TEXT), latitude (DECIMAL(10,8)), longitude (DECIMAL(11,8)), location_name (VARCHAR(255)), upvotes (INTEGER), downvotes (INTEGER), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ)';
    RAISE NOTICE 'Constraints: content length (1-1000 chars), latitude (-90 to 90), longitude (-180 to 180), author_id FK to users';
    RAISE NOTICE 'Indexes: idx_posts_author_id, idx_posts_created_at_desc, idx_posts_location';
    RAISE NOTICE 'Triggers: posts_updated_at_trigger (auto-update updated_at on UPDATE)';
END $$; 