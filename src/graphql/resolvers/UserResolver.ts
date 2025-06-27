import 'reflect-metadata';
import { Ctx, Query, Resolver, UseMiddleware } from 'type-graphql';
import { GraphQLContext } from '../../types';
import { GraphQLAuthGuard, GraphQLOptionalAuthGuard } from '../middleware/auth.middleware';
import { User } from '../types/User';

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  @UseMiddleware(GraphQLAuthGuard)
  async me(@Ctx() context: GraphQLContext): Promise<User | null> {
    if (!context.isAuthenticated || !context.user) {
      return null;
    }

    // Return a basic user object for testing
    return {
      id: context.user.userId,
      username: context.user.username,
      createdAt: new Date(),
      isActive: true,
    };
  }

  @Query(() => String)
  @UseMiddleware(GraphQLOptionalAuthGuard)
  async hello(@Ctx() context: GraphQLContext): Promise<string> {
    if (context.isAuthenticated && context.user) {
      return `Hello ${context.user.username} from GraphQL!`;
    }
    return 'Hello from GraphQL!';
  }
} 