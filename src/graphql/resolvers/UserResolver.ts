import { Ctx, Query, Resolver } from 'type-graphql';
import { GraphQLContext } from '../../types';
import { User } from '../types/User';

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
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
  async hello(): Promise<string> {
    return 'Hello from GraphQL!';
  }
} 