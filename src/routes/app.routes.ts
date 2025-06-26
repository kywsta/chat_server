import { Router } from 'express';
import { DatabaseManager } from '../database/database.manager';
import { LoggerUtil } from '../utils/logger.util';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const databaseManager = DatabaseManager.getInstance();
    const dbHealth = await databaseManager.getHealthStatus();
    
    res.json({
      status: 'ok',
      timestamp: new Date(),
      database: dbHealth
    });
  } catch (error) {
    LoggerUtil.error('Health check failed', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date(),
      database: { status: 'unhealthy', connection: false }
    });
  }
});

// Database status endpoint
router.get('/db/status', async (req, res) => {
  try {
    const databaseManager = DatabaseManager.getInstance();
    const dbHealth = await databaseManager.getHealthStatus();
    
    res.json({
      database: dbHealth,
      timestamp: new Date()
    });
  } catch (error) {
    LoggerUtil.error('Database status check failed', error);
    res.status(500).json({
      database: {
        status: 'unhealthy',
        connection: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date()
    });
  }
});

export default router; 