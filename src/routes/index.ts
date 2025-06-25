import { Express } from 'express';
import appRoutes from './app.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

export const setupRoutes = (app: Express): void => {
  // App routes (health check, etc.)
  app.use('/', appRoutes);
  
  // Auth routes
  app.use('/auth', authRoutes);
  
  // User routes
  app.use('/users', userRoutes);
}; 