import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseManager } from '../database.manager';
import { ChatEntity, ChatRepository, FindOptions, PaginatedChats, PaginationParams } from '../interfaces/database.interface';
import { MemoryDatabase, MemoryStringRepository } from '../memory.database';
import { QueryBuilder } from '../utils/query-builder.util';

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

  async addMemberToChat(chatId: string, userId: string): Promise<ChatEntity | null> {
    const chat = await this.repository.findById(chatId);
    if (!chat) {
      return null;
    }

    // Check if user is already a member
    if (chat.memberIds.includes(userId)) {
      return chat; // Already a member, return existing chat
    }

    // Add user to memberIds array
    const updatedMemberIds = [...chat.memberIds, userId];
    return this.repository.update(chatId, { 
      memberIds: updatedMemberIds,
      updatedAt: new Date() 
    });
  }

  async removeMemberFromChat(chatId: string, userId: string): Promise<ChatEntity | null> {
    const chat = await this.repository.findById(chatId);
    if (!chat) {
      return null;
    }

    // Remove user from memberIds array
    const updatedMemberIds = chat.memberIds.filter(id => id !== userId);
    return this.repository.update(chatId, { 
      memberIds: updatedMemberIds,
      updatedAt: new Date() 
    });
  }

  async findByMemberId(userId: string): Promise<ChatEntity[]> {
    const options = QueryBuilder.create()
      .whereContains('memberIds', userId)
      .orderBy('updatedAt', 'DESC')
      .build();
    
    return this.repository.findAll(options);
  }

  // Pagination methods
  async getUserChatsPaginated(
    userId: string,
    params: PaginationParams,
    filters?: { searchTerm?: string; isGroup?: boolean }
  ): Promise<PaginatedChats> {
    LoggerUtil.debug('Getting user chats with pagination', { userId, limit: params.limit });

    // Build query to find chats where user is a member
    const queryBuilder = QueryBuilder.create()
      .whereContains('memberIds', userId)
      .orderBy('updatedAt', params.direction === 'forward' ? 'ASC' : 'DESC');

    // Apply filters
    if (filters?.searchTerm) {
      queryBuilder.whereContains('name', filters.searchTerm);
    }

    if (filters?.isGroup !== undefined) {
      queryBuilder.whereEquals('isGroup', filters.isGroup);
    }

    // Get all matching chats first for total count
    const allChats = await this.repository.findAll(queryBuilder.build());
    const totalCount = allChats.length;

    // Apply cursor filters
    if (params.afterCursor) {
      queryBuilder.whereGreaterThan('updatedAt', params.afterCursor.timestamp);
    }

    if (params.beforeCursor) {
      queryBuilder.whereLessThan('updatedAt', params.beforeCursor.timestamp);
    }

    // Apply limit and get final results
    const options = queryBuilder.limit(params.limit).build();
    const chats = await this.repository.findAll(options);

    LoggerUtil.debug('Found user chats', { userId, count: chats.length, totalCount });

    return { chats, totalCount };
  }
} 