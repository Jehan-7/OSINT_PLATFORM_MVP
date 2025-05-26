import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwt';

/**
 * Extended Request interface for authenticated routes
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    email: string;
  };
}

/**
 * Authentication middleware for protecting routes with JWT tokens
 * Validates JWT tokens and adds user information to request object
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const jwtService = new JWTService();
    
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader || '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Verify the token
    const decoded = await jwtService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Add user information to request object
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);

    // Handle specific JWT errors
    if (error.message && error.message.includes('jwt expired')) {
      res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
      return;
    }

    if (error.message && error.message.includes('Invalid token')) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Generic authentication failure
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}; 