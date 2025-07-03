import { DatabaseManager } from '../database.manager';
import { FindOptions, MessageEntity, MessageRepository, MessageType, PaginatedMessages, PaginationParams } from '../interfaces/database.interface';
import { MemoryDatabase, MemoryStringRepository } from '../memory.database';
import { QueryBuilder } from '../utils/query-builder.util';

export class MemoryMessageRepository implements MessageRepository {
  private repository: MemoryStringRepository<MessageEntity>;

  constructor(databaseManager: DatabaseManager) {
    const database = databaseManager.getDatabase() as MemoryDatabase;
    this.repository = new MemoryStringRepository<MessageEntity>(database, 'messages');
  }

  async create(data: Omit<MessageEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageEntity> {
    const message = await this.repository.create(data);
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

  // Message-specific query methods
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
    return this.repository.update(messageId, { content, updatedAt: new Date() });
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

  // Pagination methods
  async getChatMessagesPaginated(chatId: string, params: PaginationParams): Promise<PaginatedMessages> {
    const queryBuilder = QueryBuilder.create()
      .whereEquals('chatId', chatId)
      .orderBy('createdAt', params.direction === 'forward' ? 'ASC' : 'DESC');

    if (params.afterCursor) {
      queryBuilder.whereGreaterThan('createdAt', params.afterCursor!.timestamp);
    }

    if (params.beforeCursor) {
      queryBuilder.whereLessThan('createdAt', params.beforeCursor!.timestamp);
    }

    const options = queryBuilder.limit(params.limit).build();

    const messages = await this.repository.findAll(options);

    const totalCount = 0;

    return { messages, totalCount };
  }
} 