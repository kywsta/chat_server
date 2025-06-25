import cors from 'cors';
import express from 'express';
import { appConfig } from './config/app.config';
import { setupRoutes } from './routes';

const app = express();

// Middleware
app.use(cors(appConfig.cors));
app.use(express.json());

// Setup routes
setupRoutes(app);

// Start server
app.listen(appConfig.port, (): void => {
  console.log(`Chat server running on port ${appConfig.port}`);
  console.log(`Environment: ${appConfig.env}`);
  console.log(`Health check: http://localhost:${appConfig.port}/health`);
}); 