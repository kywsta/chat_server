import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { GraphQLContext } from '../types';
import { createGraphQLContext } from './context';
import { UserResolver } from './resolvers/UserResolver';

export async function createGraphQLServer() {
  // Build schema with Type-GraphQL
  const schema = await buildSchema({
    resolvers: [UserResolver],
    validate: false, // Disable validation for now
  });

  // Create Apollo Server v4
  const server = new ApolloServer<GraphQLContext>({
    schema,
    // Enable GraphQL Playground in development
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [],
  });

  // Start the server
  await server.start();

  // Return Express middleware
  return expressMiddleware(server, {
    context: createGraphQLContext,
  });
} 