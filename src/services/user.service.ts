import bcrypt from "bcryptjs";
import { appConfig } from "../config/app.config";
import { MemoryUserRepository } from "../data/repositories/MemoryUserRepository";
import { DatabaseManager } from "../database/database.manager";
import { MemoryDatabase } from "../database/memory_database/memory.database";
import { FindOptions, IUserRepository, UserEntity } from "../domain";
import { LoginRequest, RegisterRequest, UserResponse } from "../dtos";
import { LoggerUtil } from "../utils/logger.util";

export class UserService {
  private userRepository: IUserRepository;

  constructor(databaseManager: DatabaseManager) {
    const database = databaseManager.getDatabase() as MemoryDatabase;
    this.userRepository = new MemoryUserRepository(database);
  }

  async createUser(userData: RegisterRequest): Promise<UserResponse> {
    try {
      // Validate input
      if (!userData.username || !userData.password) {
        throw new Error("Username and password are required");
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByUsername(
        userData.username
      );
      if (existingUser) {
        throw new Error("Username already exists");
      }

      // Check if email already exists (if provided)
      if (userData.email) {
        const existingEmailUser = await this.userRepository.findByEmail(
          userData.email
        );
        if (existingEmailUser) {
          throw new Error("Email already exists");
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        userData.password,
        appConfig.bcryptSaltRounds
      );

      // Create user entity
      const userEntity: Omit<UserEntity, "id" | "createdAt" | "updatedAt"> = {
        username: userData.username,
        password: hashedPassword,
        isActive: true,
        ...(userData.email && { email: userData.email }),
      };

      // Save user
      const createdUser = await this.userRepository.createUser(userEntity);

      LoggerUtil.info("User created successfully", {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
      });

      // Return user response (without password)
      return {
        id: createdUser.id,
        username: createdUser.username,
        ...(createdUser.email && { email: createdUser.email }),
      };
    } catch (error) {
      LoggerUtil.error("Failed to create user", error);
      throw error;
    }
  }

  async authenticateUser(credentials: LoginRequest): Promise<UserResponse> {
    try {
      // Validate input
      if (!credentials.username || !credentials.password) {
        throw new Error("Username and password are required");
      }

      // Find user by username
      const user = await this.userRepository.findByUsername(
        credentials.username
      );
      if (!user) {
        throw new Error("Invalid username or password");
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error("User account is deactivated");
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );
      if (!isPasswordValid) {
        throw new Error("Invalid username or password");
      }

      LoggerUtil.info("User authenticated successfully", {
        id: user.id,
        username: user.username,
      });

      // Return user response (without password)
      return {
        id: user.id,
        username: user.username,
        ...(user.email && { email: user.email }),
      };
    } catch (error) {
      LoggerUtil.error("Failed to authenticate user", error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        ...(user.email && { email: user.email }),
      };
    } catch (error) {
      LoggerUtil.error("Failed to get user by ID", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<UserResponse | null> {
    try {
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        ...(user.email && { email: user.email }),
      };
    } catch (error) {
      LoggerUtil.error("Failed to get user by username", error);
      throw error;
    }
  }

  async getAllUsers(options?: FindOptions): Promise<UserResponse[]> {
    try {
      const users = await this.userRepository.findAll(options);

      return users.map((user) => ({
        id: user.id,
        username: user.username,
        ...(user.email && { email: user.email }),
      }));
    } catch (error) {
      LoggerUtil.error("Failed to get all users", error);
      throw error;
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      if (!newPassword) {
        throw new Error("New password is required");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        appConfig.bcryptSaltRounds
      );

      // Update password
      await this.userRepository.updatePassword(userId, hashedPassword);

      LoggerUtil.info("User password updated successfully", { userId });
    } catch (error) {
      LoggerUtil.error("Failed to update user password", error);
      throw error;
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      await this.userRepository.deactivateUser(userId);
      LoggerUtil.info("User deactivated successfully", { userId });
    } catch (error) {
      LoggerUtil.error("Failed to deactivate user", error);
      throw error;
    }
  }

  async activateUser(userId: string): Promise<void> {
    try {
      await this.userRepository.activateUser(userId);
      LoggerUtil.info("User activated successfully", { userId });
    } catch (error) {
      LoggerUtil.error("Failed to activate user", error);
      throw error;
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const count = await this.userRepository.count();
      LoggerUtil.debug("Retrieved user count", { count });
      return count;
    } catch (error) {
      LoggerUtil.error("Failed to get user count", error);
      throw error;
    }
  }

  async userExists(username: string): Promise<boolean> {
    try {
      return await this.userRepository.existsByUsername(username);
    } catch (error) {
      LoggerUtil.error("Failed to check if user exists", error);
      throw error;
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findById(id);
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return await this.userRepository.findByUsername(username);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findByEmail(email);
  }

  async existsByUsername(username: string): Promise<boolean> {
    return await this.userRepository.existsByUsername(username);
  }

  async updatePassword(
    userId: string,
    hashedPassword: string
  ): Promise<UserEntity | null> {
    LoggerUtil.info("Updating user password", { userId });
    return await this.userRepository.updatePassword(userId, hashedPassword);
  }

  async getActiveUsers(options?: FindOptions): Promise<UserEntity[]> {
    return await this.userRepository.getActiveUsers(options);
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number }> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ isActive: true });

    LoggerUtil.debug("Retrieved user stats", { totalUsers, activeUsers });
    return { totalUsers, activeUsers };
  }
}
