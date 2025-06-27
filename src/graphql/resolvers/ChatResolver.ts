import 'reflect-metadata';
import { Ctx, Query, Resolver, UseMiddleware } from 'type-graphql';
import { GraphQLContext } from '../../types';
import { GraphQLAuthGuard } from '../middleware/auth.middleware';
import { Chat } from '../types/Chat';
import { ChatMember, ChatMemberRole } from '../types/ChatMember';
import { Message, MessageType } from '../types/Message';

@Resolver()
export class ChatResolver {
  @Query(() => [Chat])
  @UseMiddleware(GraphQLAuthGuard)
  async getUserChats(@Ctx() context: GraphQLContext): Promise<Chat[]> {
    // Authentication is guaranteed by middleware
    const user = context.user!;

    // Return sample data for testing
    return [
      {
        id: '1',
        name: 'General Chat',
        creatorId: user.userId.toString(),
        memberIds: [user.userId.toString()],
        isGroup: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  @Query(() => [Message])
  @UseMiddleware(GraphQLAuthGuard)
  async getChatMessages(@Ctx() context: GraphQLContext): Promise<Message[]> {
    // Authentication is guaranteed by middleware
    const user = context.user!;

    // Return sample data for testing
    return [
      {
        id: '1',
        chatId: '1',
        userId: user.userId.toString(),
        content: 'Hello from GraphQL!',
        type: MessageType.TEXT,
        createdAt: new Date(),
      },
    ];
  }

  @Query(() => [ChatMember])
  @UseMiddleware(GraphQLAuthGuard)
  async getChatMembers(@Ctx() context: GraphQLContext): Promise<ChatMember[]> {
    // Authentication is guaranteed by middleware
    const user = context.user!;

    // Return sample data for testing
    return [
      {
        id: '1',
        chatId: '1',
        userId: user.userId.toString(),
        role: ChatMemberRole.ADMIN,
        joinedAt: new Date(),
        isActive: true,
      },
    ];
  }
} 