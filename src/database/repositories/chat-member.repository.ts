import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseManager } from '../database.manager';
import { ChatMemberEntity, ChatMemberRepository, ChatMemberRole, FindOptions } from '../interfaces/database.interface';

export class MemoryChatMemberRepository implements ChatMemberRepository {
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

  async create(data: Omit<ChatMemberEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMemberEntity> {
    const now = new Date();
    const member: ChatMemberEntity = {
      id: this.generateId(),
      ...data,
      joinedAt: now,
      isActive: true,
    };

    const database = this.getDatabase();
    await (database as any).createChatMember(member);
    
    LoggerUtil.debug('Chat member created', { memberId: member.id, chatId: member.chatId, userId: member.userId });
    return member;
  }

  async findById(id: string): Promise<ChatMemberEntity | null> {
    const database = this.getDatabase();
    return (database as any).getChatMemberById(id);
  }

  async findAll(options?: FindOptions): Promise<ChatMemberEntity[]> {
    const database = this.getDatabase();
    return (database as any).getAllChatMembers(options);
  }

  async update(id: string, data: Partial<ChatMemberEntity>): Promise<ChatMemberEntity | null> {
    const database = this.getDatabase();
    return (database as any).updateChatMember(id, data);
  }

  async delete(id: string): Promise<boolean> {
    const database = this.getDatabase();
    return (database as any).deleteChatMember(id);
  }

  async count(filter?: Partial<ChatMemberEntity>): Promise<number> {
    const database = this.getDatabase();
    return (database as any).countChatMembers(filter);
  }

  async findByChatId(chatId: string): Promise<ChatMemberEntity[]> {
    const database = this.getDatabase();
    return (database as any).getChatMembersByChatId(chatId);
  }

  async findByUserId(userId: string): Promise<ChatMemberEntity[]> {
    const database = this.getDatabase();
    return (database as any).getChatMembersByUserId(userId);
  }

  async findByChatAndUser(chatId: string, userId: string): Promise<ChatMemberEntity | null> {
    const database = this.getDatabase();
    return (database as any).getChatMemberByChatAndUser(chatId, userId);
  }

  async updateRole(chatId: string, userId: string, role: ChatMemberRole): Promise<ChatMemberEntity | null> {
    const member = await this.findByChatAndUser(chatId, userId);
    if (!member) return null;
    
    return this.update(member.id, { role });
  }

  async deactivateMember(chatId: string, userId: string): Promise<ChatMemberEntity | null> {
    const member = await this.findByChatAndUser(chatId, userId);
    if (!member) return null;
    
    return this.update(member.id, { isActive: false });
  }

  async getActiveMembers(chatId: string): Promise<ChatMemberEntity[]> {
    const members = await this.findByChatId(chatId);
    return members.filter(member => member.isActive);
  }

  async getAdmins(chatId: string): Promise<ChatMemberEntity[]> {
    const members = await this.getActiveMembers(chatId);
    return members.filter(member => member.role === ChatMemberRole.ADMIN);
  }
} 