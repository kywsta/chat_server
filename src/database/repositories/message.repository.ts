import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseManager } from '../database.manager';
import { FindOptions, MessageEntity, MessageRepository, MessageType } from '../interfaces/database.interface';

export class MemoryMessageRepository implements MessageRepository {
  private databaseManager: DatabaseManager;

  constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
  }

  private getDatabase() {
    return this.databaseManager.getDatabase();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async create(data: Omit<MessageEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageEntity> {
    const now = new Date();
    const message: MessageEntity = {
      id: this.generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const database = this.getDatabase();
    await (database as any).createMessage(message);
    
    LoggerUtil.debug('Message created', { messageId: message.id, chatId: message.chatId, userId: message.userId });
    return message;
  }

  async findById(id: string): Promise<MessageEntity | null> {
    const database = this.getDatabase();
    return (database as any).getMessageById(id);
  }

  async findAll(options?: FindOptions): Promise<MessageEntity[]> {
    const database = this.getDatabase();
    return (database as any).getAllMessages(options);
  }

  async update(id: string, data: Partial<MessageEntity>): Promise<MessageEntity | null> {
    const database = this.getDatabase();
    return (database as any).updateMessage(id, { ...data, updatedAt: new Date() });
  }

  async delete(id: string): Promise<boolean> {
    const database = this.getDatabase();
    return (database as any).deleteMessage(id);
  }

  async count(filter?: Partial<MessageEntity>): Promise<number> {
    const database = this.getDatabase();
    return (database as any).countMessages(filter);
  }

  async findByChatId(chatId: string, options?: FindOptions): Promise<MessageEntity[]> {
    const database = this.getDatabase();
    return (database as any).getMessagesByChatId(chatId, options);
  }

  async findByUserId(userId: string, options?: FindOptions): Promise<MessageEntity[]> {
    const database = this.getDatabase();
    return (database as any).getMessagesByUserId(userId, options);
  }

  async findReplies(messageId: string): Promise<MessageEntity[]> {
    const database = this.getDatabase();
    return (database as any).getMessageReplies(messageId);
  }

  async updateContent(messageId: string, content: string): Promise<MessageEntity | null> {
    return this.update(messageId, { content });
  }

  async getMessageCount(chatId: string): Promise<number> {
    const database = this.getDatabase();
    return (database as any).getChatMessageCount(chatId);
  }

  async getLatestMessage(chatId: string): Promise<MessageEntity | null> {
    const database = this.getDatabase();
    return (database as any).getLatestChatMessage(chatId);
  }

  async findByType(type: MessageType, options?: FindOptions): Promise<MessageEntity[]> {
    const database = this.getDatabase();
    return (database as any).getMessagesByType(type, options);
  }
} 