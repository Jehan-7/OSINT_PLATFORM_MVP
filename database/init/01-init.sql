-- OSINT Platform Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Enable PostGIS extension for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS installation
SELECT PostGIS_Version();

-- Create basic indexes for performance
-- (User table and other tables will be created in future sprints)

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'OSINT Platform database initialized successfully with PostGIS support';
END $$; 