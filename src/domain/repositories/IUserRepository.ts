import { UserEntity } from '../entities';
import { FindOptions, Repository } from './base/Repository';

export interface IUserRepository extends Repository<UserEntity> {
  findByUsername(username: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  existsByUsername(username: string): Promise<boolean>;
  createUser(userData: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  updatePassword(userId: string, hashedPassword: string): Promise<UserEntity | null>;
  deactivateUser(userId: string,): Promise<UserEntity | null>;
  activateUser(userId: string,): Promise<UserEntity | null>;
  getActiveUsers(options?: FindOptions): Promise<UserEntity[]>;
} 