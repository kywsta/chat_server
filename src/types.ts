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