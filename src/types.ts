import { Request } from "express";

export interface JWTPayload {
  userId: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export interface GraphQLContext {
  user?: JWTPayload;
  isAuthenticated: boolean;
}
