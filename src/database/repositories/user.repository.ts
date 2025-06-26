import { LoggerUtil } from '../../utils/logger.util';
import { UserEntity, UserRepository } from '../interfaces/database.interface';
import { MemoryDatabase, MemoryRepository } from '../memory.database';

export class MemoryUserRepository extends MemoryRepository<UserEntity> implements UserRepository {
  constructor(database: MemoryDatabase) {
    super(database, 'users');
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const users = await this.findAll({ filter: { username } });
    const user = users.length > 0 ? users[0]! : null;
    LoggerUtil.debug('Found user by username', { username, found: !!user });
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const users = await this.findAll({ filter: { email } });
    const user = users.length > 0 ? users[0]! : null;
    LoggerUtil.debug('Found user by email', { email, found: !!user });
    return user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    const exists = !!user;
    LoggerUtil.debug('Checked if user exists by username', { username, exists });
    return exists;
  }

  async createUser(userData: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }): Promise<UserEntity> {
    // Set default values
    const userWithDefaults = {
      ...userData,
      isActive: userData.isActive !== undefined ? userData.isActive : true
    };
    
    const user = await this.create(userWithDefaults);
    LoggerUtil.info('User created successfully', { 
      id: user.id, 
      username: user.username,
      email: user.email 
    });
    return user;
  }

  async deactivateUser(id: number): Promise<UserEntity | null> {
    const updated = await this.update(id, { isActive: false });
    if (updated) {
      LoggerUtil.info('User deactivated', { id, username: updated.username });
    }
    return updated;
  }

  async activateUser(id: number): Promise<UserEntity | null> {
    const updated = await this.update(id, { isActive: true });
    if (updated) {
      LoggerUtil.info('User activated', { id, username: updated.username });
    }
    return updated;
  }

  async getActiveUsers(options?: import('../interfaces/database.interface').FindOptions): Promise<UserEntity[]> {
    const activeUsers = await this.findAll({ 
      ...options,
      filter: { 
        ...options?.filter,
        isActive: true 
      },
      orderBy: options?.orderBy || 'createdAt',
      orderDirection: options?.orderDirection || 'DESC'
    });
    LoggerUtil.debug('Retrieved active users', { count: activeUsers.length });
    return activeUsers;
  }

  async updatePassword(id: number, hashedPassword: string): Promise<UserEntity | null> {
    const updated = await this.update(id, { password: hashedPassword });
    if (updated) {
      LoggerUtil.info('User password updated', { id, username: updated.username });
    }
    return updated;
  }
} 