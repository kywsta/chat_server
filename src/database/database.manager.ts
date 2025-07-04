import { DataEntity } from '../domain/entities/data-entity';
import { Repository } from '../domain/repositories';
import { LoggerUtil } from '../utils/logger.util';
import { DatabaseFactory, DatabaseRepositories, DatabaseType } from './database.factory';
import { DatabaseConnection } from './interfaces/database.interface';
import { DatabaseSeeder } from './seed';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: DatabaseConnection | null = null;
  private repositories: DatabaseRepositories | null = null;
  private isInitialized = false;
  private seeder: DatabaseSeeder | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(databaseType: DatabaseType, config?: any): Promise<void> {
    if (this.isInitialized) {
      LoggerUtil.warn('Database manager already initialized');
      return;
    }

    try {
      LoggerUtil.info(`Initializing database manager with type: ${databaseType}`);
      
      const { connection, repositories } = await DatabaseFactory.createDatabase(databaseType, config);
      
      await connection.connect();
      this.connection = connection;
      this.repositories = repositories;
      this.seeder = new DatabaseSeeder(this, repositories);
      this.isInitialized = true;

      LoggerUtil.info('Database manager initialized successfully');
    } catch (error) {
      LoggerUtil.error('Failed to initialize database manager', error);
      throw error;
    }
  }

  

  async shutdown(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.disconnect();
        this.connection = null;
      }
      
      this.repositories = null;
      this.seeder = null;
      this.isInitialized = false;
      
      LoggerUtil.info('Database manager shutdown successfully');
    } catch (error) {
      LoggerUtil.error('Error during database manager shutdown', error);
      throw error;
    }
  }

  getDatabase(): DatabaseConnection {
    this.ensureInitialized();
    return this.connection!;
  }

  getRepositories(): DatabaseRepositories {
    this.ensureInitialized();
    return this.repositories!;
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    connection: boolean;
    details?: any;
  }> {
    try {
      if (!this.connection || !this.isInitialized) {
        return {
          status: 'unhealthy',
          connection: false,
          details: { message: 'Database not initialized' }
        };
      }

      const healthCheck = await this.connection.healthCheck();
      return {
        status: healthCheck.isHealthy ? 'healthy' : 'unhealthy',
        connection: healthCheck.isHealthy,
        details: healthCheck.details
      };
    } catch (error) {
      LoggerUtil.error('Health check failed', error);
      return {
        status: 'unhealthy',
        connection: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async seedDatabase(): Promise<void> {
    this.ensureInitialized();
    
    try {
      LoggerUtil.info('Starting database seed...');
      
      if (this.seeder) {
        await this.seeder.seed();
      } else {
        LoggerUtil.warn('Database seeder not available');
      }
      
      LoggerUtil.info('Database seed completed successfully');
    } catch (error) {
      LoggerUtil.error('Database seed failed', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.repositories) {
      throw new Error('Database manager not initialized. Call initialize() first.');
    }
  }
} 