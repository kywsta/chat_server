import { Request } from 'express';
import { GraphQLContext, JWTPayload } from '../types';
import { JWTUtil } from '../utils/jwt.util';
import { LoggerUtil } from '../utils/logger.util';
import { extractGraphQLToken, validateGraphQLToken } from './middleware/auth.middleware';

/**
 * Creates GraphQL context with enhanced authentication and error handling
 * Integrates with existing JWT authentication system
 */
export async function createGraphQLContext({ req }: { req: Request }): Promise<GraphQLContext> {
  try {
    // Extract token from Authorization header
    const token = extractGraphQLToken(req.headers.authorization);
    
    if (!token) {
      LoggerUtil.debug('No authentication token provided in GraphQL request');
      return { 
        isAuthenticated: false
      };
    }

    // Validate token using enhanced validation
    const decoded = await validateGraphQLToken(token);
    
    LoggerUtil.debug('GraphQL context created with authenticated user', { 
      userId: decoded.userId,
      username: decoded.username 
    });
    
    return {
      user: decoded,
      isAuthenticated: true,
    };
  } catch (error) {
    // Log authentication failures for security monitoring
    LoggerUtil.warn('GraphQL authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    });
    
    return { 
      isAuthenticated: false
    };
  }
}

/**
 * Creates WebSocket context for GraphQL subscriptions
 * Handles authentication through connection parameters
 */
export async function createWebSocketContext(ctx: any): Promise<GraphQLContext> {
  try {
    // Extract token from connection parameters
    const connectionParams = ctx.connectionParams || {};
    const authHeader = connectionParams.Authorization || connectionParams.authorization;
    
    const token = extractGraphQLToken(authHeader);
    
    if (!token) {
      LoggerUtil.debug('No authentication token provided in WebSocket connection');
      return { 
        isAuthenticated: false
      };
    }

    // Validate token using enhanced validation
    const decoded = await validateGraphQLToken(token);
    
    LoggerUtil.debug('WebSocket context created with authenticated user', { 
      userId: decoded.userId,
      username: decoded.username 
    });
    
    return {
      user: decoded,
      isAuthenticated: true,
    };
  } catch (error) {
    // Log authentication failures for security monitoring
    LoggerUtil.warn('WebSocket authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      connectionParams: ctx.connectionParams ? 'provided' : 'none'
    });
    
    return { 
      isAuthenticated: false
    };
  }
}

/**
 * Legacy context creation function for backward compatibility
 * Uses the original simple JWT validation
 */
export async function createSimpleGraphQLContext({ req }: { req: Request }): Promise<GraphQLContext> {
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