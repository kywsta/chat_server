import cors from 'cors';
import express from 'express';
import 'reflect-metadata';
import { appConfig } from './config/app.config';
import { DatabaseManager } from './database/database.manager';
import { createGraphQLServer, GraphQLServerSetup } from './graphql/server';
import { requestLogger } from './middleware/app.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { setupRoutes } from './routes';
import { ServiceManager } from './services/service.manager';
import { LoggerUtil } from './utils/logger.util';

const app = express();
let graphqlSetup: GraphQLServerSetup;

// Apply middleware
app.use(cors(appConfig.cors));
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const databaseManager = DatabaseManager.getInstance();
    const dbHealth = await databaseManager.getHealthStatus();
    
    res.json({
      status: 'ok',
      timestamp: new Date(),
      environment: appConfig.environment,
      database: dbHealth
    });
  } catch (error) {
    LoggerUtil.error('Health check failed', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date(),
      environment: appConfig.environment,
      database: { status: 'unhealthy', connection: false }
    });
  }
});

// Database status endpoint
app.get('/db/status', async (req, res) => {
  try {
    const databaseManager = DatabaseManager.getInstance();
    const dbHealth = await databaseManager.getHealthStatus();
    
    res.json({
      database: {
        type: appConfig.database.type,
        ...dbHealth
      },
      timestamp: new Date()
    });
  } catch (error) {
    LoggerUtil.error('Database status check failed', error);
    res.status(500).json({
      database: {
        type: appConfig.database.type,
        status: 'unhealthy',
        connection: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date()
    });
  }
});

// Initialize application
async function initializeApp(): Promise<void> {
  try {
    // Initialize database
    const databaseManager = DatabaseManager.getInstance();
    await databaseManager.initialize('memory');
    
    // Initialize services
    const serviceManager = ServiceManager.getInstance();
    await serviceManager.initialize();
    
    // Seed database if needed
    await databaseManager.seedDatabase();
    
    // Setup GraphQL endpoint with WebSocket support
    graphqlSetup = await createGraphQLServer();
    app.use('/graphql', cors(), graphqlSetup.expressMiddleware);
    
    // Setup REST routes AFTER services are initialized
    setupRoutes(app);
    
    // Error handling middleware (must be last)
    app.use(errorHandler);
    
    LoggerUtil.info('Application initialized successfully');
  } catch (error) {
    LoggerUtil.error('Failed to initialize application', error);
    throw error;
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  try {
    LoggerUtil.info('Shutting down application...');
    
    const databaseManager = DatabaseManager.getInstance();
    await databaseManager.shutdown();
    
    LoggerUtil.info('Application shutdown completed');
    process.exit(0);
  } catch (error) {
    LoggerUtil.error('Error during shutdown', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer(): Promise<void> {
  try {
    await initializeApp();
    
    // Use the HTTP server from GraphQL setup to support WebSocket
    graphqlSetup.httpServer.on('request', app);
    
    graphqlSetup.httpServer.listen(appConfig.port, () => {
      LoggerUtil.info(`Chat server running on port ${appConfig.port}`);
      LoggerUtil.info(`Environment: ${appConfig.environment}`);
      LoggerUtil.info(`Database type: ${appConfig.database.type}`);
      LoggerUtil.info(`Health check: http://localhost:${appConfig.port}/health`);
      LoggerUtil.info(`GraphQL endpoint: http://localhost:${appConfig.port}/graphql`);
      LoggerUtil.info(`WebSocket subscriptions: ws://localhost:${appConfig.port}/graphql`);
    });
  } catch (error) {
    LoggerUtil.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer(); 