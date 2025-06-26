import { LoggerUtil } from '../utils/logger.util';
import { DatabaseConnection, DatabaseHealth, FindOptions, Repository } from './interfaces/database.interface';

export class MemoryDatabase implements DatabaseConnection {
  private connected: boolean = false;
  private collections: Map<string, Map<number, any>> = new Map();
  private sequences: Map<string, number> = new Map();
  private connectionTime: number = Date.now();

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
      this.sequences.clear();
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
    const collections = this.collections.size;
    const totalRecords = Array.from(this.collections.values()).reduce((sum, map) => sum + map.size, 0);
    
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

  getNextId(collectionName: string): number {
    const currentId = this.sequences.get(collectionName) || 0;
    const nextId = currentId + 1;
    this.sequences.set(collectionName, nextId);
    return nextId;
  }

  createRepository<T extends { id: number; createdAt: Date; updatedAt: Date }>(collectionName: string): Repository<T> {
    return new MemoryRepository<T>(this, collectionName);
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