import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseManager } from '../database.manager';
import { ChatEntity, ChatRepository, FindOptions } from '../interfaces/database.interface';

export class MemoryChatRepository implements ChatRepository {
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

  async create(data: Omit<ChatEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatEntity> {
    const now = new Date();
    const chat: ChatEntity = {
      id: this.generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const database = this.getDatabase();
    await (database as any).createChat(chat);
    
    LoggerUtil.debug('Chat created', { chatId: chat.id, name: chat.name, creatorId: chat.creatorId });
    return chat;
  }

  async findById(id: string): Promise<ChatEntity | null> {
    const database = this.getDatabase();
    return (database as any).getChatById(id);
  }

  async findAll(options?: FindOptions): Promise<ChatEntity[]> {
    const database = this.getDatabase();
    return (database as any).getAllChats(options);
  }

  async update(id: string, data: Partial<ChatEntity>): Promise<ChatEntity | null> {
    const database = this.getDatabase();
    return (database as any).updateChat(id, { ...data, updatedAt: new Date() });
  }

  async delete(id: string): Promise<boolean> {
    const database = this.getDatabase();
    return (database as any).deleteChat(id);
  }

  async count(filter?: Partial<ChatEntity>): Promise<number> {
    const database = this.getDatabase();
    return (database as any).countChats(filter);
  }

  async findByCreatorId(creatorId: string): Promise<ChatEntity[]> {
    const database = this.getDatabase();
    return (database as any).getChatsByCreator(creatorId);
  }

  async findByMemberId(memberId: string): Promise<ChatEntity[]> {
    const database = this.getDatabase();
    return (database as any).getChatsByMember(memberId);
  }

  async addMember(chatId: string, userId: string): Promise<void> {
    const database = this.getDatabase();
    await (database as any).addChatMember(chatId, userId);
    LoggerUtil.debug('Member added to chat', { chatId, userId });
  }

  async removeMember(chatId: string, userId: string): Promise<void> {
    const database = this.getDatabase();
    await (database as any).removeChatMember(chatId, userId);
    LoggerUtil.debug('Member removed from chat', { chatId, userId });
  }

  async getMembers(chatId: string): Promise<string[]> {
    const database = this.getDatabase();
    return (database as any).getChatMembers(chatId);
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