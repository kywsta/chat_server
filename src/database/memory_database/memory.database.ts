import { DataEntity } from '../../domain/entities/data-entity';
import { FindOptions, Repository } from '../../domain/repositories';
import { LoggerUtil } from '../../utils/logger.util';
import { DatabaseConnection, DatabaseHealth } from '../interfaces/database.interface';
import { FilterUtil } from './filter.util';

export class MemoryDatabase implements DatabaseConnection {
  private collections: Map<string, Map<number, any>> = new Map();
  private stringCollections: Map<string, Map<string, any>> = new Map();
  private isConnectedFlag: boolean = false;
  private startTime: Date = new Date();

  async connect(): Promise<void> {
    LoggerUtil.info('Connecting to memory database...');
    this.isConnectedFlag = true;
    LoggerUtil.info('Memory database connected successfully');
  }

  async disconnect(): Promise<void> {
    LoggerUtil.info('Disconnecting from memory database...');
    this.isConnectedFlag = false;
    this.collections.clear();
    this.stringCollections.clear();
    LoggerUtil.info('Memory database disconnected successfully');
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async getHealth(): Promise<DatabaseHealth> {
    const totalCollections = this.collections.size + this.stringCollections.size;
    let totalRecords = 0;
    
    // Count records in number-keyed collections
    for (const collection of this.collections.values()) {
      totalRecords += collection.size;
    }
    
    // Count records in string-keyed collections
    for (const collection of this.stringCollections.values()) {
      totalRecords += collection.size;
    }

    const uptime = Date.now() - this.startTime.getTime();

    return {
      isHealthy: this.isConnectedFlag,
      timestamp: new Date(),
      details: {
        collections: totalCollections,
        totalRecords,
        uptime: Math.floor(uptime / 1000), // in seconds
      }
    };
  }

  async healthCheck(): Promise<{ isHealthy: boolean; details?: any }> {
    const health = await this.getHealth();
    return {
      isHealthy: health.isHealthy,
      details: health.details
    };
  }

  getCollection<T>(name: string): Map<string, T> {
    if (!this.stringCollections.has(name)) {
      this.stringCollections.set(name, new Map<string, T>());
    }
    return this.stringCollections.get(name)!;
  }

  // Statistics methods
  getStats() {
    const stats: any = {
      collections: {},
      totalRecords: 0
    };

    // Count records in number-keyed collections
    for (const [name, collection] of this.collections.entries()) {
      stats.collections[name] = collection.size;
      stats.totalRecords += collection.size;
    }

    // Count records in string-keyed collections
    for (const [name, collection] of this.stringCollections.entries()) {
      stats.collections[name] = collection.size;
      stats.totalRecords += collection.size;
    }

    return stats;
  }
}

// Base repository implementation for entities with string IDs
export class MemoryRepository<T extends DataEntity> implements Repository<T> {
  constructor(
    protected database: MemoryDatabase,
    protected collectionName: string
  ) {}

  protected getCollection(): Map<string, T> {
    return this.database.getCollection<T>(this.collectionName);
  }

  protected generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = this.generateId();
    const now = new Date();
    
    const entity: T = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    } as T;

    const collection = this.getCollection();
    collection.set(id, entity);
    
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const collection = this.getCollection();
    return collection.get(id) || null;
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    const collection = this.getCollection();
    let entities = Array.from(collection.values());

    // Apply filter
    if (options?.filter) {
      entities = entities.filter(entity => {
        return Object.entries(options.filter!).every(([key, value]) => {
          return (entity as any)[key] === value;
        });
      });
    }

    // Apply conditional filters
    if (options?.conditionalFilters) {
      entities = entities.filter(entity =>
        FilterUtil.applyAllConditionalFilters(entity, options.conditionalFilters!)
      );
    }

    // Apply sorting
    if (options?.orderBy) {
      entities.sort((a, b) => {
        const aValue = (a as any)[options.orderBy!];
        const bValue = (b as any)[options.orderBy!];
        
        if (aValue < bValue) return options.orderDirection === 'DESC' ? 1 : -1;
        if (aValue > bValue) return options.orderDirection === 'DESC' ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    if (options?.offset || options?.limit) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      entities = entities.slice(start, end);
    }

    return entities;
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
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const collection = this.getCollection();
    const deleted = collection.delete(id);
    
    return deleted;
  }

  async count(filter?: Partial<T>): Promise<number> {
    const entities = await this.findAll(filter ? { filter } : undefined);
    return entities.length;
  }
} 
