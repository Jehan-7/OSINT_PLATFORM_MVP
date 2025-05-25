import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';

/**
 * Custom error interface for structured error handling
 */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 * 
 * @param err - The error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default error values
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details (but not sensitive information)
  console.error(`Error ${statusCode}: ${message}`);
  if (config.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`
    }
  });
} 