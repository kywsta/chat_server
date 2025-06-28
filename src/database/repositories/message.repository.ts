import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseManager } from '../database.manager';
import { FindOptions, MessageEntity, MessageRepository, MessageType } from '../interfaces/database.interface';
import { MemoryDatabase, MemoryStringRepository } from '../memory.database';

export class MemoryMessageRepository implements MessageRepository {
  private repository: MemoryStringRepository<MessageEntity>;
  private databaseManager: DatabaseManager;

  constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
    const database = databaseManager.getDatabase() as MemoryDatabase;
    this.repository = new MemoryStringRepository<MessageEntity>(database, 'messages');
  }

  async create(data: Omit<MessageEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageEntity> {
    const message = await this.repository.create(data);
    
    // Business logic: Update chat's last message
    await this.updateChatLastMessage(message.chatId, message.id);
    
    LoggerUtil.debug('Message created', { messageId: message.id, chatId: message.chatId, userId: message.userId });
    return message;
  }

  async findById(id: string): Promise<MessageEntity | null> {
    return this.repository.findById(id);
  }

  async findAll(options?: FindOptions): Promise<MessageEntity[]> {
    return this.repository.findAll(options);
  }

  async update(id: string, data: Partial<MessageEntity>): Promise<MessageEntity | null> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async count(filter?: Partial<MessageEntity>): Promise<number> {
    return this.repository.count(filter);
  }

  // Business logic methods - implemented in repository layer
  async findByChatId(chatId: string, options?: FindOptions): Promise<MessageEntity[]> {
    const mergedOptions = {
      ...options,
      filter: { ...options?.filter, chatId },
      orderBy: options?.orderBy || 'createdAt',
      orderDirection: options?.orderDirection || 'DESC'
    };
    return this.repository.findAll(mergedOptions);
  }

  async findByUserId(userId: string, options?: FindOptions): Promise<MessageEntity[]> {
    const mergedOptions = {
      ...options,
      filter: { ...options?.filter, userId },
      orderBy: options?.orderBy || 'createdAt',
      orderDirection: options?.orderDirection || 'DESC'
    };
    return this.repository.findAll(mergedOptions);
  }

  async findReplies(messageId: string): Promise<MessageEntity[]> {
    return this.repository.findAll({ 
      filter: { replyToId: messageId },
      orderBy: 'createdAt',
      orderDirection: 'ASC'
    });
  }

  async updateContent(messageId: string, content: string): Promise<MessageEntity | null> {
    return this.update(messageId, { content });
  }

  async getMessageCount(chatId: string): Promise<number> {
    return this.repository.count({ chatId });
  }

  async getLatestMessage(chatId: string): Promise<MessageEntity | null> {
    const messages = await this.findByChatId(chatId, { limit: 1 });
    return messages[0] || null;
  }

  async findByType(type: MessageType, options?: FindOptions): Promise<MessageEntity[]> {
    const mergedOptions = {
      ...options,
      filter: { ...options?.filter, type },
      orderBy: options?.orderBy || 'createdAt',
      orderDirection: options?.orderDirection || 'DESC'
    };
    return this.repository.findAll(mergedOptions);
  }

  // Private helper method for business logic
  private async updateChatLastMessage(chatId: string, messageId: string): Promise<void> {
    try {
      // Get the chat repository to update the lastMessageId
      const database = this.repository['database'] as MemoryDatabase;
      const chatRepository = new MemoryStringRepository<any>(database, 'chats');
      
      await chatRepository.update(chatId, { 
        lastMessageId: messageId,
        updatedAt: new Date()
      });
      
      LoggerUtil.debug('Updated chat last message', { chatId, messageId });
    } catch (error) {
      LoggerUtil.error('Failed to update chat last message', error);
      // Don't throw here - message creation should still succeed
    }
  }
} 