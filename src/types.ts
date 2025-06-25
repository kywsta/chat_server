export interface User {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
}

export interface UserResponse {
  id: number;
  username: string;
  createdAt: Date;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserResponse;
}

export interface JWTPayload {
  userId: number;
  username: string;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
} 