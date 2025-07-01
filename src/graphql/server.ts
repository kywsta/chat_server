import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import { PubSub } from 'graphql-subscriptions';
import { useServer } from 'graphql-ws/use/ws';
import { createServer } from 'http';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { WebSocketServer } from 'ws';
import { GraphQLContext } from '../types';
import { LoggerUtil } from '../utils/logger.util';
import { createGraphQLContext, createWebSocketContext } from './context';
import { ChatResolver } from './resolvers/ChatResolver';
import { UserResolver } from './resolvers/UserResolver';

// Create PubSub instance for in-memory subscriptions
export const pubSub = new PubSub();

export interface GraphQLServerSetup {
  httpServer: ReturnType<typeof createServer>;
  expressMiddleware: ReturnType<typeof expressMiddleware>;
  wsServer: WebSocketServer;
}

export async function createGraphQLServer(): Promise<GraphQLServerSetup> {
  try {
    LoggerUtil.info('Building GraphQL schema...');
    LoggerUtil.info('Resolvers to register:', { resolvers: ['UserResolver', 'ChatResolver'] });
  
    // Build schema with Type-GraphQL
    const schema = await buildSchema({
      resolvers: [UserResolver, ChatResolver],
      validate: false, // Disable validation for now
      pubSub: pubSub as any, // Type assertion to bypass compatibility issue
    });

    LoggerUtil.info('GraphQL schema built successfully');

    // Create HTTP server for both Express and WebSocket
    const httpServer = createServer();

    // Create WebSocket server
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });

    // Set up WebSocket server with graphql-ws
    const serverCleanup = useServer({
      schema,
      context: async (ctx: any) => {
        // Create WebSocket context with authentication
        return await createWebSocketContext(ctx);
      },
      onConnect: async (ctx: any) => {
        LoggerUtil.info('WebSocket client connected', {
          connectionParams: ctx.connectionParams ? 'provided' : 'none'
        });
      },
      onDisconnect: (ctx: any, code?: number, reason?: string) => {
        LoggerUtil.info('WebSocket client disconnected', { code, reason });
      },
      onError: (ctx: any, id: string, payload: any, errors: readonly Error[]) => {
        LoggerUtil.error('WebSocket error', { id, payload, errors });
      },
    }, wsServer);

    // Create Apollo Server v4 with WebSocket support
    const server = new ApolloServer<GraphQLContext>({
      schema,
      // Enable GraphQL Playground in development
      introspection: process.env.NODE_ENV !== 'production',
      plugins: [
        // Proper shutdown for the HTTP server
        ApolloServerPluginDrainHttpServer({ httpServer }),
        
        // Proper shutdown for the WebSocket server
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });

    // Start the Apollo server
    await server.start();
    LoggerUtil.info('Apollo Server started successfully');

    // Create Express middleware
    const middleware = expressMiddleware(server, {
      context: createGraphQLContext,
    });

    LoggerUtil.info('WebSocket server configured successfully');
    LoggerUtil.info('GraphQL subscriptions available at ws://localhost:3000/graphql');

    return {
      httpServer,
      expressMiddleware: middleware,
      wsServer,
    };
  } catch (error) {
    LoggerUtil.error('Failed to create GraphQL server:', error);
    throw error;
  }
}

// Export PubSub for use in resolvers
export { pubSub as graphqlPubSub };
