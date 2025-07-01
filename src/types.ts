export interface User {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
}

export interface UserResponse {
  id: number;
  username: string;
  email?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  message?: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export interface GraphQLContext {
  user?: JWTPayload;
  isAuthenticated: boolean;
}

export interface Chat {
  id: string;
  name: string;
  creatorId: string;
  memberIds: string[];
  isGroup: boolean;
  lastMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyToId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

// Subscription payload types
export interface MessageAddedPayload {
  messageAdded: Message;
}

export interface UserTypingPayload {
  userTyping: {
    chatId: string;
    userId: string;
    username: string;
    isTyping: boolean;
  };
}

export interface ChatMemberAddedPayload {
  chatMemberAdded: ChatMember;
}

export interface ChatMemberRemovedPayload {
  chatMemberRemoved: {
    chatId: string;
    userId: string;
  };
} 