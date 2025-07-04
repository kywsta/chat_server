import { UserEntity } from "../../domain/entities";
import { FindOptions, IUserRepository } from "../../domain/repositories";
import { LoggerUtil } from "../../utils/logger.util";
import {
  MemoryDatabase,
  MemoryRepository,
} from "../../database/memory_database/memory.database";

export class MemoryUserRepository
  extends MemoryRepository<UserEntity>
  implements IUserRepository
{
  constructor(database: MemoryDatabase) {
    super(database, "users");
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const users = await this.findAll({ filter: { username } });
    const user = users.length > 0 ? users[0]! : null;
    LoggerUtil.debug("Found user by username", { username, found: !!user });
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const users = await this.findAll({ filter: { email } });
    const user = users.length > 0 ? users[0]! : null;
    LoggerUtil.debug("Found user by email", { email, found: !!user });
    return user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    const exists = !!user;
    LoggerUtil.debug("Checked if user exists by username", {
      username,
      exists,
    });
    return exists;
  }

  async createUser(
    userData: Omit<UserEntity, "id" | "createdAt" | "updatedAt">
  ): Promise<UserEntity> {
    // Set default values
    const userWithDefaults = {
      ...userData,
      isActive:
        (userData as any).isActive !== undefined
          ? (userData as any).isActive
          : true,
    };

    const user = await this.create(userWithDefaults);
    LoggerUtil.info("User created successfully", {
      id: user.id,
      username: user.username,
      email: user.email,
    });
    return user;
  }

  async deactivateUser(id: string): Promise<UserEntity | null> {
    const updated = await this.update(id, { isActive: false });
    if (updated) {
      LoggerUtil.info("User deactivated", { id, username: updated.username });
    }
    return updated;
  }

  async activateUser(id: string): Promise<UserEntity | null> {
    const updated = await this.update(id, { isActive: true });
    if (updated) {
      LoggerUtil.info("User activated", { id, username: updated.username });
    }
    return updated;
  }

  async getActiveUsers(options?: FindOptions): Promise<UserEntity[]> {
    const activeUsers = await this.findAll({
      ...options,
      filter: {
        ...options?.filter,
        isActive: true,
      },
      orderBy: options?.orderBy || "createdAt",
      orderDirection: options?.orderDirection || "DESC",
    });
    LoggerUtil.debug("Retrieved active users", { count: activeUsers.length });
    return activeUsers;
  }

  async updatePassword(
    id: string,
    hashedPassword: string
  ): Promise<UserEntity | null> {
    const updated = await this.update(id, { password: hashedPassword });
    if (updated) {
      LoggerUtil.info("User password updated", {
        id,
        username: updated.username,
      });
    }
    return updated;
  }
}
