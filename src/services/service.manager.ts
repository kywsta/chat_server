import { DatabaseManager } from '../database/database.manager';
import { LoggerUtil } from '../utils/logger.util';
import { UserService } from './user.service';

export class ServiceManager {
  private static instance: ServiceManager;
  private userService: UserService | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      LoggerUtil.warn('Service manager already initialized');
      return;
    }

    try {
      LoggerUtil.info('Initializing service manager...');
      
      const databaseManager = DatabaseManager.getInstance();
      
      // Initialize services with their respective repositories
      this.userService = new UserService(databaseManager.getUserRepository());
      
      this.isInitialized = true;
      LoggerUtil.info('Service manager initialized successfully');
    } catch (error) {
      LoggerUtil.error('Failed to initialize service manager', error);
      throw error;
    }
  }

  getUserService(): UserService {
    this.ensureInitialized();
    return this.userService!;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Service manager not initialized. Call initialize() first.');
    }
  }
} 