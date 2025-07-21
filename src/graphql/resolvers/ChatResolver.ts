import "reflect-metadata";
import {
  Arg,
  Args,
  Ctx,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
  UseMiddleware,
} from "type-graphql";
import {
  ChatEntity,
  ChatMemberEntity,
  ChatMemberRole as DatabaseChatMemberRole,
  MessageType as DatabaseMessageType,
  MessageEntity,
} from "../../domain/entities";
import { ServiceManager } from "../../services/service.manager";
import { GraphQLContext } from "../../types";
import { LoggerUtil } from "../../utils/logger.util";
import { AddMemberInput } from "../inputs/AddMemberInput";
import { ChatConnectionArgs } from "../inputs/ChatConnectionArgs";
import { CreateChatInput } from "../inputs/CreateChatInput";
import { MessageConnectionArgs } from "../inputs/MessageConnectionArgs";
import { SendMessageInput } from "../inputs/SendMessageInput";
import { GraphQLAuthGuard } from "../middleware/auth.middleware";
import { pubSub } from "../server";
import { Chat } from "../types/Chat";
import { ChatMember, ChatMemberRole } from "../types/ChatMember";
import { Message, MessageType } from "../types/Message";
import { TypingIndicator } from "../types/TypingIndicator";
import { ChatConnection } from "../types/pagination/ChatConnection";
import { MessageConnection } from "../types/pagination/MessageConnection";

@Resolver()
export class ChatResolver {
  private serviceManager: ServiceManager;

  constructor() {
    this.serviceManager = ServiceManager.getInstance();
  }

  // QUERY RESOLVERS

  @Query(() => Chat, { nullable: true })
  @UseMiddleware(GraphQLAuthGuard)
  async getChat(
    @Arg("chatId") chatId: string,
    @Ctx() context: GraphQLContext
  ): Promise<Chat | null> {
    try {
      LoggerUtil.debug("GraphQL getChat called", {
        chatId,
        userId: context.user?.userId,
      });

      const chatService = this.serviceManager.getChatService();

      // Check if user is a member of the chat
      const isMember = await chatService.isUserMemberOfChat(
        chatId,
        context.user!.userId.toString()
      );
      if (!isMember) {
        throw new Error("You are not a member of this chat");
      }

      const chat = await chatService.getChatById(chatId);

      LoggerUtil.debug("GraphQL getChat result", {
        chatId,
        userId: context.user?.userId,
        found: !!chat,
      });

      return chat ? await this.mapServiceChatToGraphQL(chat) : null;
    } catch (error) {
      LoggerUtil.error("GraphQL getChat failed", error);
      throw error;
    }
  }

  @Query(() => ChatConnection)
  @UseMiddleware(GraphQLAuthGuard)
  async getChats(
    @Args() args: ChatConnectionArgs,
    @Ctx() context: GraphQLContext
  ): Promise<ChatConnection> {
    try {
      LoggerUtil.debug("GraphQL userChats pagination called", {
        userId: context.user?.userId,
        first: args.first,
        after: args.after,
        searchTerm: args.searchTerm,
        isGroup: args.isGroup,
      });

      const chatService = this.serviceManager.getChatService();
      const connection = await chatService.getChats(
        context.user!.userId.toString(),
        args
      );

      LoggerUtil.debug("GraphQL userChats pagination result", {
        userId: context.user?.userId,
        edgeCount: connection.edges.length,
        totalCount: connection.totalCount,
      });

      return connection;
    } catch (error) {
      LoggerUtil.error("GraphQL userChats pagination failed", error);
      throw error;
    }
  }

  @Query(() => MessageConnection)
  @UseMiddleware(GraphQLAuthGuard)
  async getChatMessages(
    @Args() args: MessageConnectionArgs,
    @Ctx() context: GraphQLContext
  ): Promise<MessageConnection> {
    try {
      LoggerUtil.debug("GraphQL chatMessages pagination called", {
        chatId: args.chatId,
        userId: context.user?.userId,
        first: args.first,
        after: args.after,
      });

      const messageService = this.serviceManager.getMessageService();
      const userId = context.user!.userId.toString();

      // Access control is now handled in the service layer
      const connection = await messageService.getChatMessages(args, userId);

      LoggerUtil.debug("GraphQL chatMessages pagination result", {
        chatId: args.chatId,
        userId: context.user?.userId,
        edgeCount: connection.edges.length,
        totalCount: connection.totalCount,
      });

      return connection;
    } catch (error) {
      LoggerUtil.error("GraphQL chatMessages pagination failed", error);
      throw error;
    }
  }

  @Query(() => [ChatMember])
  @UseMiddleware(GraphQLAuthGuard)
  async getChatMembers(
    @Arg("chatId") chatId: string,
    @Ctx() context: GraphQLContext
  ): Promise<ChatMember[]> {
    try {
      LoggerUtil.debug("GraphQL getChatMembers called", {
        chatId,
        userId: context.user?.userId,
      });

      const chatService = this.serviceManager.getChatService();

      // Check if user is a member of the chat
      const isMember = await chatService.isUserMemberOfChat(
        chatId,
        context.user!.userId.toString()
      );
      if (!isMember) {
        throw new Error("You are not a member of this chat");
      }

      const members = await chatService.getChatMembers(chatId);

      LoggerUtil.debug("GraphQL getChatMembers result", {
        chatId,
        userId: context.user?.userId,
        count: members.length,
      });

      const mappedMembers = await Promise.all(
        members.map((member) => this.mapServiceChatMemberToGraphQL(member))
      );
      return mappedMembers;
    } catch (error) {
      LoggerUtil.error("GraphQL getChatMembers failed", error);
      throw error;
    }
  }

  // MUTATION RESOLVERS

  @Mutation(() => Chat)
  @UseMiddleware(GraphQLAuthGuard)
  async createChat(
    @Arg("input") input: CreateChatInput,
    @Ctx() context: GraphQLContext
  ): Promise<Chat> {
    try {
      LoggerUtil.debug("GraphQL createChat called", {
        input,
        userId: context.user?.userId,
      });

      const chatService = this.serviceManager.getChatService();
      const userId = context.user!.userId.toString();

      const chat = await chatService.createChat(
        input.name,
        userId,
        input.memberIds,
        input.isGroup
      );

      LoggerUtil.info("GraphQL createChat successful", {
        chatId: chat.id,
        name: chat.name,
        creatorId: chat.creatorId,
      });

      return this.mapServiceChatToGraphQL(chat);
    } catch (error) {
      LoggerUtil.error("GraphQL createChat failed", error);
      throw error;
    }
  }

  @Mutation(() => Message)
  @UseMiddleware(GraphQLAuthGuard)
  async sendMessage(
    @Arg("input") input: SendMessageInput,
    @Ctx() context: GraphQLContext
  ): Promise<Message> {
    try {
      LoggerUtil.debug("GraphQL sendMessage called", {
        input,
        userId: context.user?.userId,
      });

      const messageService = this.serviceManager.getMessageService();
      const userId = context.user!.userId.toString();

      // Convert GraphQL MessageType to database MessageType enum
      const databaseMessageType = this.mapGraphQLMessageTypeToDatabaseEnum(
        input.type
      );

      // Access control is now handled in the service layer
      const message = await messageService.sendMessage(
        input.chatId,
        userId,
        input.content,
        databaseMessageType,
        input.replyToId
      );

      LoggerUtil.info("GraphQL sendMessage successful", {
        messageId: message.id,
        chatId: message.chatId,
        userId: message.userId,
      });

      // Map to GraphQL message
      const graphqlMessage = this.mapServiceMessageToGraphQL(message);

      // Trigger subscription for new message
      try {
        await pubSub.publish(`MESSAGE_ADDED_${input.chatId}`, {
          messageAdded: graphqlMessage,
        });
        LoggerUtil.debug("Message subscription triggered", {
          chatId: input.chatId,
          messageId: message.id,
        });
      } catch (error) {
        LoggerUtil.error("Failed to trigger message subscription", error);
        // Don't fail the mutation if subscription fails
      }

      return graphqlMessage;
    } catch (error) {
      LoggerUtil.error("GraphQL sendMessage failed", error);
      throw error;
    }
  }

  @Mutation(() => ChatMember)
  @UseMiddleware(GraphQLAuthGuard)
  async addChatMember(
    @Arg("input") input: AddMemberInput,
    @Ctx() context: GraphQLContext
  ): Promise<ChatMember> {
    try {
      LoggerUtil.debug("GraphQL addChatMember called", {
        input,
        userId: context.user?.userId,
      });

      const chatService = this.serviceManager.getChatService();
      const userId = context.user!.userId.toString();

      // Check if user is a member of the chat (basic permission check)
      const isMember = await chatService.isUserMemberOfChat(
        input.chatId,
        userId
      );
      if (!isMember) {
        throw new Error("You are not a member of this chat");
      }

      // Convert GraphQL role to database role enum
      const databaseRole = this.mapGraphQLChatMemberRoleToDatabaseEnum(
        input.role
      );

      const member = await chatService.addMember(
        input.chatId,
        input.userId,
        databaseRole
      );

      LoggerUtil.info("GraphQL addChatMember successful", {
        memberId: member.id,
        chatId: member.chatId,
        userId: member.userId,
        role: member.role,
      });

      return await this.mapServiceChatMemberToGraphQL(member);
    } catch (error) {
      LoggerUtil.error("GraphQL addChatMember failed", error);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(GraphQLAuthGuard)
  async setTypingStatus(
    @Arg("chatId") chatId: string,
    @Arg("isTyping") isTyping: boolean,
    @Ctx() context: GraphQLContext
  ): Promise<boolean> {
    try {
      LoggerUtil.debug("GraphQL setTypingStatus called", {
        chatId,
        isTyping,
        userId: context.user?.userId,
      });

      const chatService = this.serviceManager.getChatService();
      const userId = context.user!.userId.toString();
      const userName = context.user!.username;

      // Check if user is a member of the chat
      const isMember = await chatService.isUserMemberOfChat(chatId, userId);
      if (!isMember) {
        throw new Error("You are not a member of this chat");
      }

      // Trigger typing indicator subscription
      try {
        await pubSub.publish(`TYPING_${chatId}`, {
          typingIndicator: {
            chatId,
            userId,
            userName,
            isTyping,
          },
        });
        LoggerUtil.debug("Typing indicator subscription triggered", {
          chatId,
          userId,
          isTyping,
        });
      } catch (error) {
        LoggerUtil.error(
          "Failed to trigger typing indicator subscription",
          error
        );
        // Don't fail the mutation if subscription fails
      }

      return true;
    } catch (error) {
      LoggerUtil.error("GraphQL setTypingStatus failed", error);
      throw error;
    }
  }

  // SUBSCRIPTIONS

  @Subscription(() => Message, {
    subscribe: ({ args, context }) => {
      // Check authentication
      if (!context.isAuthenticated || !context.user) {
        throw new Error("Authentication required");
      }

      const topic = `MESSAGE_ADDED_${args.chatId}`;
      LoggerUtil.debug("GraphQL messageAdded subscription started", {
        chatId: args.chatId,
        userId: context.user.userId,
        topic,
      });

      return pubSub.asyncIterableIterator(topic);
    },
  })
  messageAdded(
    @Arg("chatId") chatId: string,
    @Root() messagePayload: { messageAdded: Message },
    @Ctx() context: GraphQLContext
  ): Message {
    LoggerUtil.debug("GraphQL messageAdded subscription delivering message", {
      chatId,
      messageId: messagePayload.messageAdded.id,
    });
    return messagePayload.messageAdded;
  }

  @Subscription(() => TypingIndicator, {
    subscribe: ({ args, context }) => {
      // Check authentication
      if (!context.isAuthenticated || !context.user) {
        throw new Error("Authentication required");
      }

      const topic = `TYPING_${args.chatId}`;
      LoggerUtil.debug("GraphQL typingIndicator subscription started", {
        chatId: args.chatId,
        userId: context.user.userId,
        userName: context.user.username,
        topic,
      });

      return pubSub.asyncIterableIterator(topic);
    },
  })
  typingIndicator(
    @Arg("chatId") chatId: string,
    @Root() typingPayload: { typingIndicator: TypingIndicator },
    @Ctx() context: GraphQLContext
  ): TypingIndicator {
    LoggerUtil.debug("GraphQL typingIndicator subscription delivering status", {
      chatId,
      userId: typingPayload.typingIndicator.userId,
      userName: typingPayload.typingIndicator.userName,
      isTyping: typingPayload.typingIndicator.isTyping,
    });
    return typingPayload.typingIndicator;
  }

  // PRIVATE MAPPING METHODS

  private async mapServiceChatToGraphQL(
    serviceChat: ChatEntity
  ): Promise<Chat> {
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

    // Populate members array
    try {
      const chatService = this.serviceManager.getChatService();
      const members = await chatService.getChatMembers(serviceChat.id);
      const mappedMembers = await Promise.all(
        members.map((member) => this.mapServiceChatMemberToGraphQL(member))
      );
      chat.members = mappedMembers;
    } catch (error) {
      LoggerUtil.error("Failed to populate chat members", error);
      chat.members = [];
    }

    return chat;
  }

  private mapServiceMessageToGraphQL(serviceMessage: MessageEntity): Message {
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

  private async mapServiceChatMemberToGraphQL(
    serviceMember: ChatMemberEntity
  ): Promise<ChatMember> {
    const member = new ChatMember();
    member.id = serviceMember.id;
    member.chatId = serviceMember.chatId;
    member.userId = serviceMember.userId;
    member.role = this.mapChatMemberRoleToGraphQL(serviceMember.role);
    member.joinedAt = serviceMember.joinedAt;
    member.isActive = serviceMember.isActive;

    // Fetch username from user service
    try {
      const userService = this.serviceManager.getUserService();
      const user = await userService.getUserById(serviceMember.userId);
      member.username = user?.username || "Unknown User";
    } catch (error) {
      LoggerUtil.error("Failed to fetch username for chat member", error);
      member.username = "Unknown User";
    }

    return member;
  }

  private mapMessageTypeToGraphQL(
    serviceType: "text" | "image" | "file" | "system"
  ): MessageType {
    switch (serviceType) {
      case "text":
        return MessageType.TEXT;
      case "image":
        return MessageType.IMAGE;
      case "file":
        return MessageType.FILE;
      case "system":
        return MessageType.SYSTEM;
      default:
        return MessageType.TEXT;
    }
  }

  private mapGraphQLMessageTypeToDatabaseEnum(
    graphqlType: MessageType
  ): DatabaseMessageType {
    switch (graphqlType) {
      case MessageType.TEXT:
        return DatabaseMessageType.TEXT;
      case MessageType.IMAGE:
        return DatabaseMessageType.IMAGE;
      case MessageType.FILE:
        return DatabaseMessageType.FILE;
      case MessageType.SYSTEM:
        return DatabaseMessageType.SYSTEM;
      default:
        return DatabaseMessageType.TEXT;
    }
  }

  private mapChatMemberRoleToGraphQL(
    serviceRole: "admin" | "member"
  ): ChatMemberRole {
    switch (serviceRole) {
      case "admin":
        return ChatMemberRole.ADMIN;
      case "member":
        return ChatMemberRole.MEMBER;
      default:
        return ChatMemberRole.MEMBER;
    }
  }

  private mapGraphQLChatMemberRoleToDatabaseEnum(
    graphqlRole: ChatMemberRole
  ): DatabaseChatMemberRole {
    switch (graphqlRole) {
      case ChatMemberRole.ADMIN:
        return DatabaseChatMemberRole.ADMIN;
      case ChatMemberRole.MEMBER:
        return DatabaseChatMemberRole.MEMBER;
      default:
        return DatabaseChatMemberRole.MEMBER;
    }
  }
}
