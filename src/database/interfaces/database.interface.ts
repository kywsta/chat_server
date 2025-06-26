export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealth(): Promise<DatabaseHealth>;
  healthCheck(): Promise<{
    isHealthy: boolean;
    details?: any;
  }>;
}

export interface DatabaseHealth {
  isHealthy: boolean;
  timestamp: Date;
  details?: any;
}

export interface Repository<T, ID = number> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: ID): Promise<T | null>;
  findAll(options?: FindOptions): Promise<T[]>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
}

export interface FindOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filter?: Record<string, any>;
}

export interface UserRepository extends Repository<UserEntity> {
  findByUsername(username: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  existsByUsername(username: string): Promise<boolean>;
  createUser(userData: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  updatePassword(userId: number, hashedPassword: string): Promise<UserEntity | null>;
  deactivateUser(userId: number): Promise<UserEntity | null>;
  activateUser(userId: number): Promise<UserEntity | null>;
  getActiveUsers(options?: FindOptions): Promise<UserEntity[]>;
}

export interface UserEntity {
  id: number;
  username: string;
  email?: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} 