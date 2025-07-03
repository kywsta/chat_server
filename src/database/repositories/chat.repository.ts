import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseManager } from '../database.manager';
import { ChatEntity, ChatRepository, FindOptions, PaginatedChats, PaginationParams } from '../interfaces/database.interface';
import { MemoryDatabase, MemoryStringRepository } from '../memory.database';

export class MemoryChatRepository implements ChatRepository {
  private repository: MemoryStringRepository<ChatEntity>;

  constructor(databaseManager: DatabaseManager) {
    const database = databaseManager.getDatabase() as MemoryDatabase;
    this.repository = new MemoryStringRepository<ChatEntity>(database, 'chats');
  }

  async create(data: Omit<ChatEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatEntity> {
    const chat = await this.repository.create(data);
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
    return this.repository.findAll({ filter: { creatorId } });
  }

  async updateLastMessage(chatId: string, messageId: string): Promise<ChatEntity | null> {
    return this.repository.update(chatId, { 
      lastMessageId: messageId, 
      updatedAt: new Date() 
    });
  }

  async findGroupChats(): Promise<ChatEntity[]> {
    return this.repository.findAll({ filter: { isGroup: true } });
  }

  async findDirectChats(): Promise<ChatEntity[]> {
    return this.repository.findAll({ filter: { isGroup: false } });
  }

  // Pagination methods
  async getUserChatsPaginated(
    userId: string,
    params: PaginationParams,
    filters?: { searchTerm?: string; isGroup?: boolean }
  ): Promise<PaginatedChats> {
    // Note: In a real implementation, this would be a JOIN query
    // For the in-memory database, we need to check membership through the ChatMember table
    // This method should be called from the service layer where we have access to ChatMemberRepository
    
    // Get all chats first
    let chats = await this.repository.findAll({
      orderBy: 'updatedAt',
      orderDirection: 'DESC' // Always get newest first for cursor-based pagination
    });

    // Apply filters
    if (filters?.searchTerm) {
      chats = chats.filter(chat => 
        chat.name.toLowerCase().includes(filters.searchTerm!.toLowerCase())
      );
    }

    if (filters?.isGroup !== undefined) {
      chats = chats.filter(chat => chat.isGroup === filters.isGroup);
    }

    const totalCount = chats.length;

    // Apply cursor filters
    if (params.afterCursor) {
      chats = chats.filter(chat => 
        chat.updatedAt < params.afterCursor!.timestamp ||
        (chat.updatedAt.getTime() === params.afterCursor!.timestamp.getTime() && 
         chat.id < params.afterCursor!.id)
      );
    }

    if (params.beforeCursor) {
      chats = chats.filter(chat => 
        chat.updatedAt > params.beforeCursor!.timestamp ||
        (chat.updatedAt.getTime() === params.beforeCursor!.timestamp.getTime() && 
         chat.id > params.beforeCursor!.id)
      );
    }

    // Apply limit
    chats = chats.slice(0, params.limit);

    return { chats, totalCount };
  }
} 