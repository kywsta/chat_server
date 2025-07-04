import { MemoryChatMemberRepository } from '../data/repositories/MemoryChatMemberRepository';
import { MemoryChatRepository } from '../data/repositories/MemoryChatRepository';
import { MemoryMessageRepository } from '../data/repositories/MemoryMessageRepository';
import { MemoryUserRepository } from '../data/repositories/MemoryUserRepository';
import { IChatMemberRepository } from '../domain/repositories/IChatMemberRepository';
import { IChatRepository } from '../domain/repositories/IChatRepository';
import { IMessageRepository } from '../domain/repositories/IMessageRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { LoggerUtil } from '../utils/logger.util';
import { DatabaseConnection } from './interfaces/database.interface';
import { MemoryDatabase } from './memory_database/memory.database';

export type DatabaseType = 'memory' | 'postgresql' | 'mongodb' | 'mysql';

export interface DatabaseRepositories {
  userRepository: IUserRepository;
  chatRepository: IChatRepository;
  chatMemberRepository: IChatMemberRepository;
  messageRepository: IMessageRepository;
}

export class DatabaseFactory {
  static async createDatabase(type: DatabaseType, config?: any): Promise<{
    connection: DatabaseConnection;
    repositories: DatabaseRepositories;
  }> {
    switch (type) {
      case 'memory':
        return this.createMemoryDatabase();
      
      case 'postgresql':
        // TODO: Implement PostgreSQL database
        throw new Error('PostgreSQL implementation not yet available');
      
      case 'mongodb':
        // TODO: Implement MongoDB database
        throw new Error('MongoDB implementation not yet available');
      
      case 'mysql':
        // TODO: Implement MySQL database
        throw new Error('MySQL implementation not yet available');
      
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  private static async createMemoryDatabase(): Promise<{
    connection: DatabaseConnection;
    repositories: DatabaseRepositories;
  }> {
    LoggerUtil.info('Creating memory database instance');
    
    // Create a single database instance
    const database = new MemoryDatabase();
    
    // Create repositories using the same database instance
    const userRepository = new MemoryUserRepository(database);
    const chatRepository = new MemoryChatRepository(database);
    const chatMemberRepository = new MemoryChatMemberRepository(database);
    const messageRepository = new MemoryMessageRepository(database);
    
    return {
      connection: database,
      repositories: {
        userRepository,
        chatRepository,
        chatMemberRepository,
        messageRepository,
      }
    };
  }

  // Future implementations can be added here:
  
  // private static async createPostgreSQLDatabase(config: any): Promise<{
  //   connection: DatabaseConnection;
  //   repositories: DatabaseRepositories;
  // }> {
  //   // Implementation for PostgreSQL
  // }
  
  // private static async createMongoDatabase(config: any): Promise<{
  //   connection: DatabaseConnection;
  //   repositories: DatabaseRepositories;
  // }> {
  //   // Implementation for MongoDB
  // }
} 