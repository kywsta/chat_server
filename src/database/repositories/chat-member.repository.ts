import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseManager } from '../database.manager';
import { ChatMemberEntity, ChatMemberRepository, ChatMemberRole, FindOptions } from '../interfaces/database.interface';
import { MemoryDatabase } from '../memory.database';

// Specialized repository for ChatMemberEntity with its unique structure
class ChatMemberStringRepository {
  constructor(
    private database: MemoryDatabase,
    private collectionName: string
  ) {}

  private getCollection(): Map<string, ChatMemberEntity> {
    return this.database.getStringCollection<ChatMemberEntity>(this.collectionName);
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async create(data: Omit<ChatMemberEntity, 'id'>): Promise<ChatMemberEntity> {
    const id = this.generateId();
    
    const entity: ChatMemberEntity = {
      id,
      ...data,
    };

    const collection = this.getCollection();
    collection.set(id, entity);
    
    LoggerUtil.debug(`ChatMember created in ${this.collectionName}`, { id });
    return entity;
  }

  async findById(id: string): Promise<ChatMemberEntity | null> {
    const collection = this.getCollection();
    return collection.get(id) || null;
  }

  async findAll(options: FindOptions = {}): Promise<ChatMemberEntity[]> {
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

    // Apply sorting
    if (options.orderBy) {
      entities.sort((a, b) => {
        const aValue = (a as any)[options.orderBy!];
        const bValue = (b as any)[options.orderBy!];
        
        if (aValue < bValue) return options.orderDirection === 'DESC' ? 1 : -1;
        if (aValue > bValue) return options.orderDirection === 'DESC' ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    const start = options.offset || 0;
    const end = options.limit ? start + options.limit : entities.length;
    
    return entities.slice(start, end);
  }

  async update(id: string, data: Partial<ChatMemberEntity>): Promise<ChatMemberEntity | null> {
    const collection = this.getCollection();
    const existing = collection.get(id);
    
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...data,
    } as ChatMemberEntity;

    collection.set(id, updated);
    LoggerUtil.debug(`ChatMember updated in ${this.collectionName}`, { id });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const collection = this.getCollection();
    const deleted = collection.delete(id);
    
    if (deleted) {
      LoggerUtil.debug(`ChatMember deleted from ${this.collectionName}`, { id });
    }
    
    return deleted;
  }

  async count(filter?: Partial<ChatMemberEntity>): Promise<number> {
    const entities = await this.findAll(filter ? { filter } : {});
    return entities.length;
  }
}

export class MemoryChatMemberRepository implements ChatMemberRepository {
  private repository: ChatMemberStringRepository;

  constructor(databaseManager: DatabaseManager) {
    const database = databaseManager.getDatabase() as MemoryDatabase;
    this.repository = new ChatMemberStringRepository(database, 'chatMembers');
  }

  async create(data: Omit<ChatMemberEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMemberEntity> {
    // ChatMemberEntity uses joinedAt, not createdAt, so we need to handle this properly
    const memberData = {
      ...data,
      joinedAt: new Date(),
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    
    const member = await this.repository.create(memberData);
    LoggerUtil.debug('Chat member created', { memberId: member.id, chatId: member.chatId, userId: member.userId, role: member.role });
    return member;
  }

  async findById(id: string): Promise<ChatMemberEntity | null> {
    return this.repository.findById(id);
  }

  async findAll(options?: FindOptions): Promise<ChatMemberEntity[]> {
    return this.repository.findAll(options);
  }

  async update(id: string, data: Partial<ChatMemberEntity>): Promise<ChatMemberEntity | null> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async count(filter?: Partial<ChatMemberEntity>): Promise<number> {
    return this.repository.count(filter);
  }

  // Business logic methods - implemented in repository layer
  async findByChatId(chatId: string): Promise<ChatMemberEntity[]> {
    return this.repository.findAll({ filter: { chatId } });
  }

  async findByUserId(userId: string): Promise<ChatMemberEntity[]> {
    return this.repository.findAll({ filter: { userId } });
  }

  async findByChatAndUser(chatId: string, userId: string): Promise<ChatMemberEntity | null> {
    const members = await this.repository.findAll({ filter: { chatId, userId } });
    return members[0] || null;
  }

  async updateRole(chatId: string, userId: string, role: ChatMemberRole): Promise<ChatMemberEntity | null> {
    const member = await this.findByChatAndUser(chatId, userId);
    if (!member) {
      LoggerUtil.warn('Cannot update role - member not found', { chatId, userId, role });
      return null;
    }

    const updated = await this.update(member.id, { role });
    if (updated) {
      LoggerUtil.info('Member role updated', { chatId, userId, role, memberId: member.id });
    }
    return updated;
  }

  async deactivateMember(chatId: string, userId: string): Promise<ChatMemberEntity | null> {
    const member = await this.findByChatAndUser(chatId, userId);
    if (!member) {
      LoggerUtil.warn('Cannot deactivate - member not found', { chatId, userId });
      return null;
    }

    const updated = await this.update(member.id, { isActive: false });
    if (updated) {
      LoggerUtil.info('Member deactivated', { chatId, userId, memberId: member.id });
    }
    return updated;
  }

  async getActiveMembers(chatId: string): Promise<ChatMemberEntity[]> {
    return this.repository.findAll({ 
      filter: { chatId, isActive: true },
      orderBy: 'joinedAt',
      orderDirection: 'ASC'
    });
  }

  async getAdmins(chatId: string): Promise<ChatMemberEntity[]> {
    return this.repository.findAll({ 
      filter: { chatId, role: ChatMemberRole.ADMIN, isActive: true },
      orderBy: 'joinedAt',
      orderDirection: 'ASC'
    });
  }
} 