import { Request, Response } from 'express';
import { PasswordService } from '../services/password';
import { JWTService } from '../services/jwt';
import { db } from '../services/database';
import { validateRegistrationInput, validateLoginInput } from '../utils/validation';

/**
 * Authentication Controller for OSINT Platform
 * Handles user registration and login
 * Sprint 1: User registration with JWT tokens
 */
export class AuthController {
  private passwordService: PasswordService;
  private jwtService: JWTService;

  constructor() {
    this.passwordService = new PasswordService();
    this.jwtService = new JWTService();
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      // Input validation
      const validationResult = validateRegistrationInput({ username, email, password });
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        });
        return;
      }

      // Password strength validation
      const passwordValidation = this.passwordService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: passwordValidation.errors
        });
        return;
      }

      // Check for duplicate username
      const existingUsername = await db.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUsername.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Username already exists',
          error: 'DUPLICATE_USERNAME'
        });
        return;
      }

      // Check for duplicate email
      const existingEmail = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Email already exists',
          error: 'DUPLICATE_EMAIL'
        });
        return;
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(password);

      // Insert user into database
      const insertResult = await db.query(
        `INSERT INTO users (username, email, password_hash, reputation, created_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, reputation, created_at`,
        [username, email, passwordHash, 0, new Date()]
      );

      const newUser = insertResult.rows[0];

      // Generate JWT token
      const token = await this.jwtService.generateToken({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email
      });

      // Return success response
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          reputation: newUser.reputation,
          created_at: newUser.created_at
        },
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific database errors
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          if (error.message.includes('username')) {
            res.status(409).json({
              success: false,
              message: 'Username already exists',
              error: 'DUPLICATE_USERNAME'
            });
            return;
          } else if (error.message.includes('email')) {
            res.status(409).json({
              success: false,
              message: 'Email already exists',
              error: 'DUPLICATE_EMAIL'
            });
            return;
          }
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'REGISTRATION_FAILED'
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Input validation
      const validationResult = validateLoginInput({ email, password });
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        });
        return;
      }

      // Find user by email
      const userResult = await db.query(
        'SELECT id, username, email, password_hash, reputation, created_at FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        // User not found - use generic message to prevent email enumeration
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS'
        });
        return;
      }

      const user = userResult.rows[0];

      // Verify password
      const isPasswordValid = await this.passwordService.verifyPassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        // Invalid password - use generic message to prevent timing attacks
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS'
        });
        return;
      }

      // Generate JWT token
      const token = await this.jwtService.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email
      });

      // Return success response (exclude password_hash)
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          reputation: user.reputation,
          created_at: user.created_at
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      
      // Generic error response to prevent information leakage
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'LOGIN_FAILED'
      });
    }
  }

  /**
   * Refresh JWT token (placeholder for future implementation)
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Token refresh endpoint not implemented yet',
      error: 'NOT_IMPLEMENTED'
    });
  }

  /**
   * Logout user (placeholder for future implementation)
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Logout endpoint not implemented yet',
      error: 'NOT_IMPLEMENTED'
    });
  }
} 