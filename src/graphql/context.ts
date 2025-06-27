import { Request } from 'express';
import { GraphQLContext, JWTPayload } from '../types';
import { JWTUtil } from '../utils/jwt.util';

export async function createGraphQLContext({ req }: { req: Request }): Promise<GraphQLContext> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { isAuthenticated: false };
    }

    const decoded = await JWTUtil.verifyToken(token) as JWTPayload;
    return {
      user: decoded,
      isAuthenticated: true,
    };
  } catch (error) {
    return { isAuthenticated: false };
  }
} 