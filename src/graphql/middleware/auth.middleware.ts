import { GraphQLError } from 'graphql';
import { MiddlewareFn } from 'type-graphql';
import { GraphQLContext, JWTPayload } from '../../types';
import { JWTUtil } from '../../utils/jwt.util';
import { LoggerUtil } from '../../utils/logger.util';

/**
 * Custom GraphQL Authentication Error
 */
export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
}

/**
 * Custom GraphQL Forbidden Error
 */
export class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }
}

/**
 * GraphQL Authentication Middleware
 * Ensures that the user is authenticated before accessing protected resolvers
 */
export const GraphQLAuthGuard: MiddlewareFn<GraphQLContext> = async ({ context }, next) => {
  if (!context.isAuthenticated || !context.user) {
    LoggerUtil.warn('Unauthorized GraphQL request attempt');
    throw new AuthenticationError('Authentication required. Please provide a valid JWT token.');
  }

  LoggerUtil.debug('GraphQL request authenticated', { userId: context.user.userId });
  return next();
};

/**
 * Optional Authentication Middleware
 * Allows both authenticated and unauthenticated access
 * Useful for queries that can return different data based on auth status
 */
export const GraphQLOptionalAuthGuard: MiddlewareFn<GraphQLContext> = async ({ context }, next) => {
  if (context.isAuthenticated && context.user) {
    LoggerUtil.debug('GraphQL request authenticated (optional)', { userId: context.user.userId });
  } else {
    LoggerUtil.debug('GraphQL request unauthenticated (optional)');
  }
  
  return next();
};

/**
 * Role-based Authorization Middleware
 * Checks if the authenticated user has the required permissions
 */
export const GraphQLRoleGuard = (allowedRoles: string[]): MiddlewareFn<GraphQLContext> => {
  return async ({ context }, next) => {
    if (!context.isAuthenticated || !context.user) {
      throw new AuthenticationError('Authentication required');
    }

    // For now, we'll implement a basic role check
    // In a real app, you'd fetch user roles from the database
    const userRole = 'user'; // Default role, could be fetched from user service
    
    if (!allowedRoles.includes(userRole)) {
      LoggerUtil.warn('Insufficient permissions for GraphQL request', { 
        userId: context.user.userId, 
        requiredRoles: allowedRoles,
        userRole
      });
      throw new ForbiddenError('Insufficient permissions');
    }

    LoggerUtil.debug('GraphQL request authorized', { 
      userId: context.user.userId, 
      role: userRole 
    });
    
    return next();
  };
};

/**
 * User Ownership Middleware
 * Ensures that the user can only access their own resources
 */
export const GraphQLOwnershipGuard = (userIdField: string = 'userId'): MiddlewareFn<GraphQLContext> => {
  return async ({ context, args }, next) => {
    if (!context.isAuthenticated || !context.user) {
      throw new AuthenticationError('Authentication required');
    }

    const resourceUserId = args[userIdField];
    if (resourceUserId && resourceUserId !== context.user.userId.toString()) {
      LoggerUtil.warn('Unauthorized access attempt to resource', {
        requestingUserId: context.user.userId,
        resourceUserId,
        field: userIdField
      });
      throw new ForbiddenError('Access denied. You can only access your own resources.');
    }

    return next();
  };
};

/**
 * Enhanced JWT Token Validation
 * Provides more detailed token validation with better error messages
 */
export const validateGraphQLToken = async (token: string): Promise<JWTPayload> => {
  try {
    const decoded = await JWTUtil.verifyToken(token);
    LoggerUtil.debug('GraphQL JWT token validated successfully', { userId: decoded.userId });
    return decoded;
  } catch (error) {
    LoggerUtil.warn('GraphQL JWT token validation failed', error);
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new AuthenticationError('Token has expired. Please login again.');
      } else if (error.message.includes('invalid')) {
        throw new AuthenticationError('Invalid token format.');
      }
    }
    
    throw new AuthenticationError('Token validation failed.');
  }
};

/**
 * Extract and validate token from GraphQL request headers
 */
export const extractGraphQLToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const token = JWTUtil.extractTokenFromHeader(authHeader);
  if (!token) {
    LoggerUtil.debug('No valid token found in GraphQL request headers');
    return null;
  }

  return token;
}; 