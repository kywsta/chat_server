import { DatabaseManager } from '../database/database.manager';
import { LoggerUtil } from '../utils/logger.util';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { UserService } from './user.service';

export class ServiceManager {
  private static instance: ServiceManager;
  private databaseManager: DatabaseManager;
  private userService?: UserService;
  private chatService?: ChatService;
  private messageService?: MessageService;
  private isInitialized = false;

  private constructor() {
    this.databaseManager = DatabaseManager.getInstance();
  }

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
      this.isInitialized = true;
      LoggerUtil.info('Service manager initialized successfully');
    } catch (error) {
      LoggerUtil.error('Failed to initialize service manager', error);
      throw error;
    }
  }

  getUserService(): UserService {
    this.ensureInitialized();
    if (!this.userService) {
      LoggerUtil.debug('Creating UserService instance');
      this.userService = new UserService(this.databaseManager);
    }
    return this.userService;
  }

  getChatService(): ChatService {
    this.ensureInitialized();
    if (!this.chatService) {
      LoggerUtil.debug('Creating ChatService instance');
      
      const chatRepository = this.databaseManager.getRepositories().chatRepository;
      const chatMemberRepository = this.databaseManager.getRepositories().chatMemberRepository;
      
      this.chatService = new ChatService(chatRepository, chatMemberRepository);
    }
    return this.chatService;
  }

  getMessageService(): MessageService {
    this.ensureInitialized();
    if (!this.messageService) {
      LoggerUtil.debug('Creating MessageService instance');
      
      const messageRepository = this.databaseManager.getRepositories().messageRepository;
      const chatRepository = this.databaseManager.getRepositories().chatRepository;
      
      this.messageService = new MessageService(messageRepository, chatRepository);
    }
    return this.messageService;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Service manager not initialized. Call initialize() first.');
    }
  }
} 