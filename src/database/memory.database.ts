import { LoggerUtil } from '../utils/logger.util';
import { ChatEntity, ChatMemberEntity, DatabaseConnection, DatabaseHealth, FindOptions, MessageEntity, MessageType, Repository } from './interfaces/database.interface';

export class MemoryDatabase implements DatabaseConnection {
  private connected: boolean = false;
  private collections: Map<string, Map<number, any>> = new Map();
  private stringCollections: Map<string, Map<string, any>> = new Map();
  private sequences: Map<string, number> = new Map();
  private connectionTime: number = Date.now();

  // Chat-specific storage
  private chatMembers: Map<string, string[]> = new Map(); // chatId -> userIds

  async connect(): Promise<void> {
    try {
      this.connected = true;
      LoggerUtil.info('Memory database connected successfully');
    } catch (error) {
      LoggerUtil.error('Failed to connect to memory database', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.connected = false;
      this.collections.clear();
      this.stringCollections.clear();
      this.sequences.clear();
      this.chatMembers.clear();
      LoggerUtil.info('Memory database disconnected successfully');
    } catch (error) {
      LoggerUtil.error('Failed to disconnect from memory database', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getHealth(): Promise<DatabaseHealth> {
    const collections = this.collections.size + this.stringCollections.size;
    const totalRecords = Array.from(this.collections.values()).reduce((sum, map) => sum + map.size, 0) +
                        Array.from(this.stringCollections.values()).reduce((sum, map) => sum + map.size, 0);
    
    return {
      isHealthy: this.connected,
      timestamp: new Date(),
      details: {
        collections,
        totalRecords,
        uptime: this.connected ? Date.now() - this.connectionTime : 0
      }
    };
  }

  async healthCheck(): Promise<{
    isHealthy: boolean;
    details?: any;
  }> {
    const health = await this.getHealth();
    return {
      isHealthy: health.isHealthy,
      details: health.details
    };
  }

  getCollection<T>(name: string): Map<number, T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
      this.sequences.set(name, 0);
    }
    return this.collections.get(name)!;
  }

  getStringCollection<T>(name: string): Map<string, T> {
    if (!this.stringCollections.has(name)) {
      this.stringCollections.set(name, new Map());
    }
    return this.stringCollections.get(name)!;
  }

  getNextId(collectionName: string): number {
    const currentId = this.sequences.get(collectionName) || 0;
    const nextId = currentId + 1;
    this.sequences.set(collectionName, nextId);
    return nextId;
  }

  createRepository<T extends { id: number; createdAt: Date; updatedAt: Date }>(collectionName: string): Repository<T> {
    return new MemoryRepository<T>(this, collectionName);
  }

  // Chat operations
  async createChat(chat: ChatEntity): Promise<ChatEntity> {
    const collection = this.getStringCollection<ChatEntity>('chats');
    collection.set(chat.id, chat);
    LoggerUtil.debug('Chat created in memory database', { chatId: chat.id });
    return chat;
  }

  async getChatById(id: string): Promise<ChatEntity | null> {
    const collection = this.getStringCollection<ChatEntity>('chats');
    return collection.get(id) || null;
  }

  async getAllChats(options?: FindOptions): Promise<ChatEntity[]> {
    const collection = this.getStringCollection<ChatEntity>('chats');
    let chats = Array.from(collection.values());
    
    if (options?.filter) {
      chats = chats.filter(chat => {
        return Object.entries(options.filter!).every(([key, value]) => {
          return (chat as any)[key] === value;
        });
      });
    }
    
    return chats;
  }

  async updateChat(id: string, data: Partial<ChatEntity>): Promise<ChatEntity | null> {
    const collection = this.getStringCollection<ChatEntity>('chats');
    const existing = collection.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...data };
    collection.set(id, updated);
    return updated;
  }

  async deleteChat(id: string): Promise<boolean> {
    const collection = this.getStringCollection<ChatEntity>('chats');
    return collection.delete(id);
  }

  async countChats(filter?: Partial<ChatEntity>): Promise<number> {
    const chats = await this.getAllChats(filter ? { filter } : undefined);
    return chats.length;
  }

  async getChatsByCreator(creatorId: string): Promise<ChatEntity[]> {
    return this.getAllChats({ filter: { creatorId } });
  }

  async getChatsByMember(memberId: string): Promise<ChatEntity[]> {
    const memberCollection = this.getStringCollection<ChatMemberEntity>('chatMembers');
    const memberEntries = Array.from(memberCollection.values())
      .filter(member => member.userId === memberId && member.isActive);
    
    const chatIds = memberEntries.map(member => member.chatId);
    const chatCollection = this.getStringCollection<ChatEntity>('chats');
    
    return chatIds.map(chatId => chatCollection.get(chatId)).filter(Boolean) as ChatEntity[];
  }

  async addChatMember(chatId: string, userId: string): Promise<void> {
    const members = this.chatMembers.get(chatId) || [];
    if (!members.includes(userId)) {
      members.push(userId);
      this.chatMembers.set(chatId, members);
    }
  }

  async removeChatMember(chatId: string, userId: string): Promise<void> {
    const members = this.chatMembers.get(chatId) || [];
    const filtered = members.filter(id => id !== userId);
    this.chatMembers.set(chatId, filtered);
  }

  async getChatMembers(chatId: string): Promise<string[]> {
    return this.chatMembers.get(chatId) || [];
  }

  // Message operations
  async createMessage(message: MessageEntity): Promise<MessageEntity> {
    const collection = this.getStringCollection<MessageEntity>('messages');
    collection.set(message.id, message);
    
    // Update chat's last message
    await this.updateChat(message.chatId, { lastMessageId: message.id, updatedAt: new Date() });
    
    LoggerUtil.debug('Message created in memory database', { messageId: message.id, chatId: message.chatId });
    return message;
  }

  async getMessageById(id: string): Promise<MessageEntity | null> {
    const collection = this.getStringCollection<MessageEntity>('messages');
    return collection.get(id) || null;
  }

  async getAllMessages(options?: FindOptions): Promise<MessageEntity[]> {
    const collection = this.getStringCollection<MessageEntity>('messages');
    let messages = Array.from(collection.values());
    
    if (options?.filter) {
      messages = messages.filter(message => {
        return Object.entries(options.filter!).every(([key, value]) => {
          return (message as any)[key] === value;
        });
      });
    }
    
    // Default sort by createdAt DESC
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (options?.offset) {
      messages = messages.slice(options.offset);
    }
    if (options?.limit) {
      messages = messages.slice(0, options.limit);
    }
    
    return messages;
  }

  async updateMessage(id: string, data: Partial<MessageEntity>): Promise<MessageEntity | null> {
    const collection = this.getStringCollection<MessageEntity>('messages');
    const existing = collection.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...data };
    collection.set(id, updated);
    return updated;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const collection = this.getStringCollection<MessageEntity>('messages');
    return collection.delete(id);
  }

  async countMessages(filter?: Partial<MessageEntity>): Promise<number> {
    const messages = await this.getAllMessages(filter ? { filter } : undefined);
    return messages.length;
  }

  async getMessagesByChatId(chatId: string, options?: FindOptions): Promise<MessageEntity[]> {
    return this.getAllMessages({ ...options, filter: { ...options?.filter, chatId } });
  }

  async getMessagesByUserId(userId: string, options?: FindOptions): Promise<MessageEntity[]> {
    return this.getAllMessages({ ...options, filter: { ...options?.filter, userId } });
  }

  async getMessageReplies(messageId: string): Promise<MessageEntity[]> {
    return this.getAllMessages({ filter: { replyToId: messageId } });
  }

  async getChatMessageCount(chatId: string): Promise<number> {
    return this.countMessages({ chatId });
  }

  async getLatestChatMessage(chatId: string): Promise<MessageEntity | null> {
    const messages = await this.getMessagesByChatId(chatId, { limit: 1 });
    return messages[0] || null;
  }

  async getMessagesByType(type: MessageType, options?: FindOptions): Promise<MessageEntity[]> {
    return this.getAllMessages({ ...options, filter: { ...options?.filter, type } });
  }

  // Chat Member operations
  async createChatMember(member: ChatMemberEntity): Promise<ChatMemberEntity> {
    const collection = this.getStringCollection<ChatMemberEntity>('chatMembers');
    collection.set(member.id, member);
    
    // Also add to chatMembers map for quick lookup
    await this.addChatMember(member.chatId, member.userId);
    
    LoggerUtil.debug('Chat member created in memory database', { memberId: member.id, chatId: member.chatId, userId: member.userId });
    return member;
  }

  async getChatMemberById(id: string): Promise<ChatMemberEntity | null> {
    const collection = this.getStringCollection<ChatMemberEntity>('chatMembers');
    return collection.get(id) || null;
  }

  async getAllChatMembers(options?: FindOptions): Promise<ChatMemberEntity[]> {
    const collection = this.getStringCollection<ChatMemberEntity>('chatMembers');
    let members = Array.from(collection.values());
    
    if (options?.filter) {
      members = members.filter(member => {
        return Object.entries(options.filter!).every(([key, value]) => {
          return (member as any)[key] === value;
        });
      });
    }
    
    return members;
  }

  async updateChatMember(id: string, data: Partial<ChatMemberEntity>): Promise<ChatMemberEntity | null> {
    const collection = this.getStringCollection<ChatMemberEntity>('chatMembers');
    const existing = collection.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...data };
    collection.set(id, updated);
    return updated;
  }

  async deleteChatMember(id: string): Promise<boolean> {
    const collection = this.getStringCollection<ChatMemberEntity>('chatMembers');
    const member = collection.get(id);
    if (member) {
      await this.removeChatMember(member.chatId, member.userId);
    }
    return collection.delete(id);
  }

  async countChatMembers(filter?: Partial<ChatMemberEntity>): Promise<number> {
    const members = await this.getAllChatMembers(filter ? { filter } : undefined);
    return members.length;
  }

  async getChatMembersByChatId(chatId: string): Promise<ChatMemberEntity[]> {
    return this.getAllChatMembers({ filter: { chatId } });
  }

  async getChatMembersByUserId(userId: string): Promise<ChatMemberEntity[]> {
    return this.getAllChatMembers({ filter: { userId } });
  }

  async getChatMemberByChatAndUser(chatId: string, userId: string): Promise<ChatMemberEntity | null> {
    const members = await this.getAllChatMembers({ filter: { chatId, userId } });
    return members[0] || null;
  }
}

export class MemoryRepository<T extends { id: number; createdAt: Date; updatedAt: Date }> implements Repository<T> {
  constructor(
    private database: MemoryDatabase,
    private collectionName: string
  ) {}

  private getCollection(): Map<number, T> {
    return this.database.getCollection<T>(this.collectionName);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const collection = this.getCollection();
    const id = this.database.getNextId(this.collectionName);
    const now = new Date();
    
    const entity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    } as T;

    collection.set(id, entity);
    LoggerUtil.debug(`Created entity in ${this.collectionName}`, { id });
    return entity;
  }

  async findById(id: number): Promise<T | null> {
    const collection = this.getCollection();
    const entity = collection.get(id) || null;
    LoggerUtil.debug(`Found entity by ID in ${this.collectionName}`, { id, found: !!entity });
    return entity;
  }

  async findAll(options: FindOptions = {}): Promise<T[]> {
    const collection = this.getCollection();
    let entities = Array.from(collection.values());

    // Apply filter
    if (options.filter) {
      entities = entities.filter(entity => {
        return Object.entries(options.filter!).every(([key, value]) => {
          return (entity as any)[key] === value;
        });
      });
    }

    // Apply ordering
    if (options.orderBy) {
      entities.sort((a, b) => {
        const aVal = (a as any)[options.orderBy!];
        const bVal = (b as any)[options.orderBy!];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.orderDirection === 'DESC' ? -comparison : comparison;
      });
    }

    // Apply pagination
    if (options.offset) {
      entities = entities.slice(options.offset);
    }
    if (options.limit) {
      entities = entities.slice(0, options.limit);
    }

    LoggerUtil.debug(`Found entities in ${this.collectionName}`, { count: entities.length, options });
    return entities;
  }

  async update(id: number, data: Partial<T>): Promise<T | null> {
    const collection = this.getCollection();
    const existing = collection.get(id);
    
    if (!existing) {
      LoggerUtil.debug(`Entity not found for update in ${this.collectionName}`, { id });
      return null;
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    } as T;

    collection.set(id, updated);
    LoggerUtil.debug(`Updated entity in ${this.collectionName}`, { id });
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const collection = this.getCollection();
    const deleted = collection.delete(id);
    LoggerUtil.debug(`Deleted entity in ${this.collectionName}`, { id, deleted });
    return deleted;
  }

  async count(filter?: Partial<T>): Promise<number> {
    const collection = this.getCollection();
    
    if (!filter) {
      return collection.size;
    }

    const entities = Array.from(collection.values());
    const filteredCount = entities.filter(entity => {
      return Object.entries(filter).every(([key, value]) => {
        return (entity as any)[key] === value;
      });
    }).length;

    LoggerUtil.debug(`Counted entities in ${this.collectionName}`, { count: filteredCount, filter });
    return filteredCount;
  }
} 