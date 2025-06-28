import { LoggerUtil } from '../utils/logger.util';
import { DatabaseConnection, DatabaseHealth, FindOptions, Repository } from './interfaces/database.interface';

export class MemoryDatabase implements DatabaseConnection {
  private connected: boolean = false;
  private collections: Map<string, Map<number, any>> = new Map();
  private stringCollections: Map<string, Map<string, any>> = new Map();
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
      this.stringCollections.clear();
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

  // Basic collection access methods
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

  // Factory method for creating repositories
  createRepository<T extends { id: number; createdAt: Date; updatedAt: Date }>(collectionName: string): Repository<T> {
    return new MemoryRepository<T>(this, collectionName);
  }
}

// Generic repository implementation for numeric IDs
export class MemoryRepository<T extends { id: number; createdAt: Date; updatedAt: Date }> implements Repository<T> {
  constructor(
    private database: MemoryDatabase,
    private collectionName: string
  ) {}

  private getCollection(): Map<number, T> {
    return this.database.getCollection<T>(this.collectionName);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const id = this.database.getNextId(this.collectionName);
    
    const entity = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    } as T;

    const collection = this.getCollection();
    collection.set(id, entity);
    
    LoggerUtil.debug(`Entity created in ${this.collectionName}`, { id });
    return entity;
  }

  async findById(id: number): Promise<T | null> {
    const collection = this.getCollection();
    return collection.get(id) || null;
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

  async update(id: number, data: Partial<T>): Promise<T | null> {
    const collection = this.getCollection();
    const existing = collection.get(id);
    
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    } as T;

    collection.set(id, updated);
    LoggerUtil.debug(`Entity updated in ${this.collectionName}`, { id });
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const collection = this.getCollection();
    const deleted = collection.delete(id);
    
    if (deleted) {
      LoggerUtil.debug(`Entity deleted from ${this.collectionName}`, { id });
    }
    
    return deleted;
  }

  async count(filter?: Partial<T>): Promise<number> {
    const entities = await this.findAll(filter ? { filter } : {});
    return entities.length;
  }
}

// String-based repository for entities with string IDs
export class MemoryStringRepository<T extends { id: string; createdAt: Date; updatedAt?: Date }> {
  constructor(
    private database: MemoryDatabase,
    private collectionName: string
  ) {}

  private getCollection(): Map<string, T> {
    return this.database.getStringCollection<T>(this.collectionName);
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const id = this.generateId();
    
    const entity = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    } as T;

    const collection = this.getCollection();
    collection.set(id, entity);
    
    LoggerUtil.debug(`Entity created in ${this.collectionName}`, { id });
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const collection = this.getCollection();
    return collection.get(id) || null;
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

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const collection = this.getCollection();
    const existing = collection.get(id);
    
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    } as T;

    collection.set(id, updated);
    LoggerUtil.debug(`Entity updated in ${this.collectionName}`, { id });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const collection = this.getCollection();
    const deleted = collection.delete(id);
    
    if (deleted) {
      LoggerUtil.debug(`Entity deleted from ${this.collectionName}`, { id });
    }
    
    return deleted;
  }

  async count(filter?: Partial<T>): Promise<number> {
    const entities = await this.findAll(filter ? { filter } : {});
    return entities.length;
  }
} 
