import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController';

/**
 * Authentication routes for OSINT Platform
 * Handles user registration, login, and token management
 * Sprint 1: Registration endpoint with rate limiting
 */

const router = Router();
const authController = new AuthController();

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1000 : 15 * 60 * 1000, // 1 second for tests, 15 minutes for production
  max: process.env.NODE_ENV === 'test' ? 100 : 5, // 100 for tests, 5 for production
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// More restrictive rate limiting for registration
const registrationRateLimit = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1000 : 60 * 60 * 1000, // 1 second for tests, 1 hour for production
  max: process.env.NODE_ENV === 'test' ? 100 : 3, // 100 for tests, 3 for production
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later',
    error: 'REGISTRATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Body:
 * - username: string (3-50 chars, alphanumeric + underscore)
 * - email: string (valid email format)
 * - password: string (8+ chars, uppercase, lowercase, number, special char)
 * 
 * Returns:
 * - 201: User registered successfully with JWT token
 * - 400: Validation failed
 * - 409: Username or email already exists
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
router.post('/register', registrationRateLimit, async (req, res) => {
  await authController.register(req, res);
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * (Placeholder for future implementation)
 */
router.post('/login', authRateLimit, async (req, res) => {
  await authController.login(req, res);
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 * (Placeholder for future implementation)
 */
router.post('/refresh', authRateLimit, async (req, res) => {
  await authController.refreshToken(req, res);
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate token
 * (Placeholder for future implementation)
 */
router.post('/logout', authRateLimit, async (req, res) => {
  await authController.logout(req, res);
});

export { router as authRoutes }; 