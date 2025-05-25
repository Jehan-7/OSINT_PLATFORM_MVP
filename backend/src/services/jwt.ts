import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

/**
 * JWT payload interface for user authentication
 */
export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  [key: string]: any;
}

/**
 * Decoded JWT token interface
 */
export interface DecodedToken extends JWTPayload {
  iat: number; // issued at
  exp?: number; // expires at
}

/**
 * JWT service for OSINT Platform
 * Handles secure token generation, validation, and refresh
 * Sprint 1: User authentication with JWT tokens
 */
export class JWTService {
  private readonly secret: string;
  private readonly defaultExpiresIn: string;

  constructor(secret?: string, defaultExpiresIn: string = '24h') {
    this.secret = secret || config.JWT_SECRET;
    this.defaultExpiresIn = defaultExpiresIn;

    if (!this.secret) {
      throw new Error('JWT secret is required');
    }

    if (this.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long for security');
    }
  }

  /**
   * Generate a JWT token for user authentication
   * @param payload - User data to include in token
   * @param expiresIn - Token expiration time (default: 24h)
   * @returns Promise<string> - Signed JWT token
   */
  async generateToken(payload: JWTPayload, expiresIn?: string): Promise<string> {
    // Input validation
    if (payload === null || payload === undefined) {
      throw new Error('Payload is required');
    }

    if (typeof payload !== 'object') {
      throw new Error('Payload must be an object');
    }

    try {
      const options: any = {
        algorithm: 'HS256',
        issuer: 'osint-platform',
        audience: 'osint-platform-users'
      };

      // Add expiration if specified
      if (expiresIn !== undefined) {
        options.expiresIn = expiresIn;
      } else {
        options.expiresIn = this.defaultExpiresIn;
      }

      const token = jwt.sign(payload, this.secret, options);
      return token;
    } catch (error) {
      throw new Error(`Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token to verify
   * @returns Promise<DecodedToken> - Decoded token payload
   */
  async verifyToken(token: string): Promise<DecodedToken> {
    // Input validation
    if (token === null || token === undefined) {
      throw new Error('Token is required');
    }

    if (typeof token !== 'string') {
      throw new Error('Token must be a string');
    }

    if (token.trim().length === 0) {
      throw new Error('Token cannot be empty');
    }

    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: 'osint-platform',
        audience: 'osint-platform-users'
      }) as DecodedToken;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('jwt expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid token: ${error.message}`);
      } else {
        throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Refresh a JWT token (generate new token with updated expiration)
   * @param token - Current valid token to refresh
   * @param expiresIn - New expiration time (default: 24h)
   * @returns Promise<string> - New JWT token
   */
  async refreshToken(token: string, expiresIn?: string): Promise<string> {
    try {
      // Verify the current token first
      const decoded = await this.verifyToken(token);

      // Remove JWT-specific fields and create new payload
      const { iat, exp, iss, aud, ...payload } = decoded;

      // Generate new token with refreshed expiration
      const newToken = await this.generateToken(payload as JWTPayload, expiresIn);
      return newToken;
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract JWT token from Authorization header
   * @param authHeader - Authorization header value
   * @returns string | null - Extracted token or null if invalid
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const parts = authHeader.split(' ');
    
    // Check for "Bearer <token>" format
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    const token = parts[1];
    
    // Basic token format validation
    if (!token || token.split('.').length !== 3) {
      return null;
    }

    return token;
  }

  /**
   * Get token expiration date
   * @param token - JWT token to check
   * @returns Date | null - Expiration date or null if no expiration
   */
  getTokenExpiration(token: string): Date | null {
    try {
      // Decode without verification to get expiration
      const decoded = jwt.decode(token) as any;
      
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000); // Convert from seconds to milliseconds
    } catch (error) {
      throw new Error(`Failed to get token expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a token is expired
   * @param token - JWT token to check
   * @returns boolean - True if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      
      if (!expiration) {
        return false; // Tokens without expiration never expire
      }

      return expiration.getTime() <= Date.now();
    } catch (error) {
      return true; // Consider invalid tokens as expired
    }
  }

  /**
   * Decode token without verification (for debugging/inspection)
   * @param token - JWT token to decode
   * @returns any - Decoded payload (unverified)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`Failed to decode token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current JWT secret (for testing purposes only)
   * @returns string - JWT secret (masked for security)
   */
  getSecretInfo(): string {
    return `${this.secret.substring(0, 4)}${'*'.repeat(this.secret.length - 8)}${this.secret.substring(this.secret.length - 4)}`;
  }
} 