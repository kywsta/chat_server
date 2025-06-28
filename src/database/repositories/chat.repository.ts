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

  // Business logic methods - implemented in repository layer
  async findByCreatorId(creatorId: string): Promise<ChatEntity[]> {
    return this.repository.findAll({ filter: { creatorId } });
  }

  async findByMemberId(memberId: string): Promise<ChatEntity[]> {
    // This requires cross-collection lookup, which is business logic
    // We need to find all ChatMemberEntity records for this user, then get their chats
    const database = this.repository['database'] as MemoryDatabase; // Access the database through the repository
    const chatMemberRepository = new MemoryStringRepository(database, 'chatMembers');
    
    const memberEntries = await chatMemberRepository.findAll({ 
      filter: { userId: memberId, isActive: true } 
    });
    
    const chatIds = memberEntries.map((member: any) => member.chatId);
    
    // Get all chats and filter by the chat IDs
    const allChats = await this.repository.findAll();
    return allChats.filter(chat => chatIds.includes(chat.id));
  }

  async addMember(chatId: string, userId: string): Promise<void> {
    // This is business logic that should be handled by ChatMemberRepository
    // This method should not exist in ChatRepository - it's a cross-concern
    LoggerUtil.warn('addMember called on ChatRepository - this should be handled by ChatMemberRepository');
    throw new Error('addMember should be handled by ChatMemberRepository, not ChatRepository');
  }

  async removeMember(chatId: string, userId: string): Promise<void> {
    // This is business logic that should be handled by ChatMemberRepository
    LoggerUtil.warn('removeMember called on ChatRepository - this should be handled by ChatMemberRepository');
    throw new Error('removeMember should be handled by ChatMemberRepository, not ChatRepository');
  }

  async getMembers(chatId: string): Promise<string[]> {
    // This is business logic that should be handled by ChatMemberRepository
    LoggerUtil.warn('getMembers called on ChatRepository - this should be handled by ChatMemberRepository');
    throw new Error('getMembers should be handled by ChatMemberRepository, not ChatRepository');
  }

  async updateLastMessage(chatId: string, messageId: string): Promise<ChatEntity | null> {
    return this.update(chatId, { lastMessageId: messageId });
  }

  async findGroupChats(userId: string): Promise<ChatEntity[]> {
    const userChats = await this.findByMemberId(userId);
    return userChats.filter(chat => chat.isGroup);
  }

  async findDirectChats(userId: string): Promise<ChatEntity[]> {
    const userChats = await this.findByMemberId(userId);
    return userChats.filter(chat => !chat.isGroup);
  }
} 