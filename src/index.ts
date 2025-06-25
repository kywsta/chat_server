import cors from 'cors';
import express from 'express';
import { appConfig } from './config/app.config';
import { requestLogger } from './middleware/app.middleware';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { setupRoutes } from './routes';
import { LoggerUtil } from './utils/logger.util';

const app = express();

// Middleware
app.use(cors(appConfig.cors));
app.use(express.json());
app.use(requestLogger);

// Setup routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(appConfig.port, (): void => {
  LoggerUtil.info(`Chat server running on port ${appConfig.port}`);
  LoggerUtil.info(`Environment: ${appConfig.env}`);
  LoggerUtil.info(`Health check: http://localhost:${appConfig.port}/health`);
}); 