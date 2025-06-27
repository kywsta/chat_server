import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { GraphQLContext } from '../types';
import { LoggerUtil } from '../utils/logger.util';
import { createGraphQLContext } from './context';
import { ChatResolver } from './resolvers/ChatResolver';
import { UserResolver } from './resolvers/UserResolver';

export async function createGraphQLServer() {
  try {
    LoggerUtil.info('Building GraphQL schema...');
    LoggerUtil.info('Resolvers to register:', { resolvers: ['UserResolver', 'ChatResolver'] });
    
    // Build schema with Type-GraphQL
    const schema = await buildSchema({
      resolvers: [UserResolver, ChatResolver],
      validate: false, // Disable validation for now
    });

    LoggerUtil.info('GraphQL schema built successfully');

    // Create Apollo Server v4
    const server = new ApolloServer<GraphQLContext>({
      schema,
      // Enable GraphQL Playground in development
      introspection: process.env.NODE_ENV !== 'production',
      plugins: [],
    });

    // Start the server
    await server.start();
    LoggerUtil.info('Apollo Server started successfully');

    // Return Express middleware
    return expressMiddleware(server, {
      context: createGraphQLContext,
    });
  } catch (error) {
    LoggerUtil.error('Failed to create GraphQL server:', error);
    throw error;
  }
} 