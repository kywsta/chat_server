import bcrypt from 'bcryptjs';
import { User, UserResponse } from '../types';
import { appConfig } from '../config/app.config';

// In-memory user storage (replace with database in production)
let users: User[] = [];

export class UserModel {
  static async create(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, appConfig.bcryptSaltRounds);
    
    const newUser: User = {
      id: users.length + 1,
      username,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(newUser);
    return newUser;
  }

  static findByUsername(username: string): User | undefined {
    return users.find(user => user.username === username);
  }

  static findById(id: number): User | undefined {
    return users.find(user => user.id === id);
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static getAllUsers(): UserResponse[] {
    return users.map(user => ({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    }));
  }

  static toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    };
  }

  static userExists(username: string): boolean {
    return users.some(user => user.username === username);
  }

  // For development/testing purposes
  static clearAllUsers(): void {
    users = [];
  }

  static getUserCount(): number {
    return users.length;
  }
} 