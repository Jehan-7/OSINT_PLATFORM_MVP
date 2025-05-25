import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { healthRouter } from './routes/health';
import { authRoutes } from './routes/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Create and configure Express application
 * @returns {express.Application} Configured Express app
 */
function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // CORS configuration for frontend integration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later.'
      }
    }
  });
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRoutes);

  // 404 handler for unknown routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

// Create and export the app instance
export const app = createApp(); 