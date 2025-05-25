import { Router, Request, Response } from 'express';
import { config } from '../config/environment';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 * 
 * Returns the current health status of the application including:
 * - Success status
 * - Health status
 * - Current timestamp
 * - Application uptime
 * - Environment information
 */
router.get('/health', (req: Request, res: Response) => {
  const healthData = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV
  };

  res.status(200).json(healthData);
});

export { router as healthRouter }; 