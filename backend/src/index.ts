import { app } from './app';
import { config } from './config/environment';

/**
 * Start the Express server
 */
function startServer(): void {
  const server = app.listen(config.PORT, () => {
    console.log(`🚀 OSINT Platform API server running on port ${config.PORT}`);
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${config.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
} 