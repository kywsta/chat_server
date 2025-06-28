import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseManager } from '../database.manager';
import { ChatEntity, ChatRepository, FindOptions } from '../interfaces/database.interface';
import { MemoryDatabase, MemoryStringRepository } from '../memory.database';

export class MemoryChatRepository implements ChatRepository {
  private repository: MemoryStringRepository<ChatEntity>;

  constructor(databaseManager: DatabaseManager) {
    const database = databaseManager.getDatabase() as MemoryDatabase;
    this.repository = new MemoryStringRepository<ChatEntity>(database, 'chats');
  }

  async create(data: Omit<ChatEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatEntity> {
    const chat = await this.repository.create(data);
    LoggerUtil.debug('Chat created', { chatId: chat.id, name: chat.name, creatorId: chat.creatorId });
    return chat;
  }

  async findById(id: string): Promise<ChatEntity | null> {
    return this.repository.findById(id);
  }

  async findAll(options?: FindOptions): Promise<ChatEntity[]> {
    return this.repository.findAll(options);
  }

  async update(id: string, data: Partial<ChatEntity>): Promise<ChatEntity | null> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async count(filter?: Partial<ChatEntity>): Promise<number> {
    return this.repository.count(filter);
  }

  // Chat-specific query methods
  async findByCreatorId(creatorId: string): Promise<ChatEntity[]> {
    return this.repository.findAll({ 
      filter: { creatorId },
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    });
  }

  async updateLastMessage(chatId: string, messageId: string): Promise<ChatEntity | null> {
    return this.update(chatId, { 
      lastMessageId: messageId,
      updatedAt: new Date()
    });
  }

  async findGroupChats(): Promise<ChatEntity[]> {
    return this.repository.findAll({ 
      filter: { isGroup: true },
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    });
  }

  async findDirectChats(): Promise<ChatEntity[]> {
    return this.repository.findAll({ 
      filter: { isGroup: false },
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    });
  }
} 