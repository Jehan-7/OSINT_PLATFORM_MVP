import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? 'env.test' : 'env.example';
dotenv.config({ path: path.join(__dirname, '..', '..', envFile) });

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_SALT_ROUNDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

/**
 * Validates and returns environment configuration
 * @returns {EnvironmentConfig} Validated environment configuration
 * @throws {Error} If required environment variables are missing
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'BCRYPT_SALT_ROUNDS',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS'
  ];

  // Check for missing environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    NODE_ENV: process.env.NODE_ENV!,
    PORT: parseInt(process.env.PORT!, 10),
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10),
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS!, 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!, 10)
  };
}

// Export the configuration instance
export const config = getEnvironmentConfig(); 