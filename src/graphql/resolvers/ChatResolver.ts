import 'reflect-metadata';
import { Arg, Ctx, Int, Query, Resolver, UseMiddleware } from 'type-graphql';
import { ServiceManager } from '../../services/service.manager';
import { GraphQLContext, Chat as ServiceChat, ChatMember as ServiceChatMember, Message as ServiceMessage } from '../../types';
import { LoggerUtil } from '../../utils/logger.util';
import { GraphQLAuthGuard } from '../middleware/auth.middleware';
import { Chat } from '../types/Chat';
import { ChatMember, ChatMemberRole } from '../types/ChatMember';
import { Message, MessageType } from '../types/Message';

@Resolver()
export class ChatResolver {
  private serviceManager: ServiceManager;

  constructor() {
    this.serviceManager = ServiceManager.getInstance();
  }

  @Query(() => [Chat])
  @UseMiddleware(GraphQLAuthGuard)
  async getUserChats(@Ctx() context: GraphQLContext): Promise<Chat[]> {
    try {
      LoggerUtil.debug('GraphQL getUserChats called', { userId: context.user?.userId });
      
      const chatService = this.serviceManager.getChatService();
      const chats = await chatService.getUserChats(context.user!.userId.toString());
      
      LoggerUtil.debug('GraphQL getUserChats result', { userId: context.user?.userId, count: chats.length });
      return chats.map(chat => this.mapServiceChatToGraphQL(chat));
    } catch (error) {
      LoggerUtil.error('GraphQL getUserChats failed', error);
      throw error;
    }
  }

  @Query(() => [Message])
  @UseMiddleware(GraphQLAuthGuard)
  async getChatMessages(
    @Arg('chatId') chatId: string,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
    @Ctx() context: GraphQLContext
  ): Promise<Message[]> {
    try {
      LoggerUtil.debug('GraphQL getChatMessages called', { 
        chatId, 
        limit, 
        offset, 
        userId: context.user?.userId 
      });

      const chatService = this.serviceManager.getChatService();
      const messageService = this.serviceManager.getMessageService();

      // Check if user is a member of the chat
      const isMember = await chatService.isUserMemberOfChat(chatId, context.user!.userId.toString());
      if (!isMember) {
        throw new Error('You are not a member of this chat');
      }

      const messages = await messageService.getChatMessages(chatId, limit, offset);
      
      LoggerUtil.debug('GraphQL getChatMessages result', { 
        chatId, 
        userId: context.user?.userId, 
        count: messages.length 
      });
      
      return messages.map(msg => this.mapServiceMessageToGraphQL(msg));
    } catch (error) {
      LoggerUtil.error('GraphQL getChatMessages failed', error);
      throw error;
    }
  }

  @Query(() => [ChatMember])
  @UseMiddleware(GraphQLAuthGuard)
  async getChatMembers(
    @Arg('chatId') chatId: string,
    @Ctx() context: GraphQLContext
  ): Promise<ChatMember[]> {
    try {
      LoggerUtil.debug('GraphQL getChatMembers called', { 
        chatId, 
        userId: context.user?.userId 
      });

      const chatService = this.serviceManager.getChatService();

      // Check if user is a member of the chat
      const isMember = await chatService.isUserMemberOfChat(chatId, context.user!.userId.toString());
      if (!isMember) {
        throw new Error('You are not a member of this chat');
      }

      const members = await chatService.getChatMembers(chatId);
      
      LoggerUtil.debug('GraphQL getChatMembers result', { 
        chatId, 
        userId: context.user?.userId, 
        count: members.length 
      });
      
      return members.map(member => this.mapServiceChatMemberToGraphQL(member));
    } catch (error) {
      LoggerUtil.error('GraphQL getChatMembers failed', error);
      throw error;
    }
  }

  @Query(() => Chat, { nullable: true })
  @UseMiddleware(GraphQLAuthGuard)
  async getChat(
    @Arg('chatId') chatId: string,
    @Ctx() context: GraphQLContext
  ): Promise<Chat | null> {
    try {
      LoggerUtil.debug('GraphQL getChat called', { 
        chatId, 
        userId: context.user?.userId 
      });

      const chatService = this.serviceManager.getChatService();

      // Check if user is a member of the chat
      const isMember = await chatService.isUserMemberOfChat(chatId, context.user!.userId.toString());
      if (!isMember) {
        throw new Error('You are not a member of this chat');
      }

      const chat = await chatService.getChatById(chatId);
      
      LoggerUtil.debug('GraphQL getChat result', { 
        chatId, 
        userId: context.user?.userId, 
        found: !!chat 
      });
      
      return chat ? this.mapServiceChatToGraphQL(chat) : null;
    } catch (error) {
      LoggerUtil.error('GraphQL getChat failed', error);
      throw error;
    }
  }

  private mapServiceChatToGraphQL(serviceChat: ServiceChat): Chat {
    const chat = new Chat();
    chat.id = serviceChat.id;
    chat.name = serviceChat.name;
    chat.creatorId = serviceChat.creatorId;
    chat.memberIds = serviceChat.memberIds;
    chat.isGroup = serviceChat.isGroup;
    chat.createdAt = serviceChat.createdAt;
    chat.updatedAt = serviceChat.updatedAt;
    
    if (serviceChat.lastMessageId) {
      chat.lastMessageId = serviceChat.lastMessageId;
    }
    
    return chat;
  }

  private mapServiceMessageToGraphQL(serviceMessage: ServiceMessage): Message {
    const message = new Message();
    message.id = serviceMessage.id;
    message.chatId = serviceMessage.chatId;
    message.userId = serviceMessage.userId;
    message.content = serviceMessage.content;
    message.type = this.mapMessageTypeToGraphQL(serviceMessage.type);
    message.createdAt = serviceMessage.createdAt;
    
    if (serviceMessage.replyToId) {
      message.replyToId = serviceMessage.replyToId;
    }
    
    if (serviceMessage.updatedAt) {
      message.updatedAt = serviceMessage.updatedAt;
    }
    
    return message;
  }

  private mapServiceChatMemberToGraphQL(serviceMember: ServiceChatMember): ChatMember {
    const member = new ChatMember();
    member.id = serviceMember.id;
    member.chatId = serviceMember.chatId;
    member.userId = serviceMember.userId;
    member.role = this.mapChatMemberRoleToGraphQL(serviceMember.role);
    member.joinedAt = serviceMember.joinedAt;
    member.isActive = serviceMember.isActive;
    
    return member;
  }

  private mapMessageTypeToGraphQL(serviceType: 'text' | 'image' | 'file' | 'system'): MessageType {
    switch (serviceType) {
      case 'text':
        return MessageType.TEXT;
      case 'image':
        return MessageType.IMAGE;
      case 'file':
        return MessageType.FILE;
      case 'system':
        return MessageType.SYSTEM;
      default:
        return MessageType.TEXT;
    }
  }

  private mapChatMemberRoleToGraphQL(serviceRole: 'admin' | 'member'): ChatMemberRole {
    switch (serviceRole) {
      case 'admin':
        return ChatMemberRole.ADMIN;
      case 'member':
        return ChatMemberRole.MEMBER;
      default:
        return ChatMemberRole.MEMBER;
    }
  }
} 