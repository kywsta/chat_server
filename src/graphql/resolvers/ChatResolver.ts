import 'reflect-metadata';
import { Ctx, Query, Resolver } from 'type-graphql';
import { GraphQLContext } from '../../types';
import { Chat } from '../types/Chat';
import { ChatMember, ChatMemberRole } from '../types/ChatMember';
import { Message, MessageType } from '../types/Message';

@Resolver()
export class ChatResolver {
  @Query(() => [Chat])
  async getUserChats(@Ctx() context: GraphQLContext): Promise<Chat[]> {
    if (!context.isAuthenticated || !context.user) {
      return [];
    }

    // Return sample data for testing
    return [
      {
        id: '1',
        name: 'General Chat',
        creatorId: context.user.userId.toString(),
        memberIds: [context.user.userId.toString()],
        isGroup: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  @Query(() => [Message])
  async getChatMessages(@Ctx() context: GraphQLContext): Promise<Message[]> {
    if (!context.isAuthenticated || !context.user) {
      return [];
    }

    // Return sample data for testing
    return [
      {
        id: '1',
        chatId: '1',
        userId: context.user.userId.toString(),
        content: 'Hello from GraphQL!',
        type: MessageType.TEXT,
        createdAt: new Date(),
      },
    ];
  }

  @Query(() => [ChatMember])
  async getChatMembers(@Ctx() context: GraphQLContext): Promise<ChatMember[]> {
    if (!context.isAuthenticated || !context.user) {
      return [];
    }

    // Return sample data for testing
    return [
      {
        id: '1',
        chatId: '1',
        userId: context.user.userId.toString(),
        role: ChatMemberRole.ADMIN,
        joinedAt: new Date(),
        isActive: true,
      },
    ];
  }
} 