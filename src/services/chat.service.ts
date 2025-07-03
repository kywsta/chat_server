import { ChatEntity, ChatMemberEntity, ChatMemberRole } from '../database/interfaces/database.interface';
import { MemoryChatMemberRepository } from '../database/repositories/chat-member.repository';
import { MemoryChatRepository } from '../database/repositories/chat.repository';
import { ChatConnectionArgs } from '../graphql/inputs/ChatConnectionArgs';
import { Chat, ChatMember } from '../types';
import { LoggerUtil } from '../utils/logger.util';
import { PaginationUtil } from '../utils/pagination.util';

export class ChatService {
  private chatRepository: MemoryChatRepository;
  private chatMemberRepository: MemoryChatMemberRepository;

  constructor(
    chatRepository: MemoryChatRepository,
    chatMemberRepository: MemoryChatMemberRepository
  ) {
    this.chatRepository = chatRepository;
    this.chatMemberRepository = chatMemberRepository;
  }

  async createChat(name: string, creatorId: string, memberIds: string[] = [], isGroup: boolean = true): Promise<Chat> {
    try {
      LoggerUtil.debug('Creating chat', { name, creatorId, memberIds, isGroup });

      // Create the chat
      const chatData = {
        name,
        creatorId,
        isGroup,
      };

      const chat = await this.chatRepository.create(chatData);

      // Add creator as admin
      await this.chatMemberRepository.create({
        chatId: chat.id,
        userId: creatorId,
        role: ChatMemberRole.ADMIN,
        joinedAt: new Date(),
        isActive: true,
      });

      // Add other members
      for (const memberId of memberIds) {
        if (memberId !== creatorId) {
          await this.chatMemberRepository.create({
            chatId: chat.id,
            userId: memberId,
            role: ChatMemberRole.MEMBER,
            joinedAt: new Date(),
            isActive: true,
          });
        }
      }

      LoggerUtil.info('Chat created successfully', { chatId: chat.id, name: chat.name });
      return this.mapChatEntityToChat(chat);
    } catch (error) {
      LoggerUtil.error('Failed to create chat', error);
      throw error;
    }
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      LoggerUtil.debug('Getting user chats', { userId });

      // Get all chat memberships for the user
      const memberships = await this.chatMemberRepository.findByUserId(userId);
      const activeMemberships = memberships.filter(membership => membership.isActive);

      // Get the chats for these memberships
      const chats: Chat[] = [];
      for (const membership of activeMemberships) {
        const chat = await this.chatRepository.findById(membership.chatId);
        if (chat) {
          chats.push(this.mapChatEntityToChat(chat));
        }
      }

      // Sort by updatedAt descending
      chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      LoggerUtil.debug('Found user chats', { userId, count: chats.length });
      return chats;
    } catch (error) {
      LoggerUtil.error('Failed to get user chats', error);
      throw error;
    }
  }

  async getUserChatsConnection(userId: string, args: ChatConnectionArgs) {
    try {
      LoggerUtil.debug('Getting user chats with pagination', { userId, first: args.first, after: args.after });

      // Get all chat memberships for the user
      const memberships = await this.chatMemberRepository.findByUserId(userId);
      const activeMemberships = memberships.filter(membership => membership.isActive);

      // Get the chats for these memberships
      let chats: ChatEntity[] = [];
      for (const membership of activeMemberships) {
        const chat = await this.chatRepository.findById(membership.chatId);
        if (chat) {
          chats.push(chat);
        }
      }

      // Apply filters
      if (args.searchTerm) {
        chats = chats.filter(chat => 
          chat.name.toLowerCase().includes(args.searchTerm!.toLowerCase())
        );
      }

      if (args.isGroup !== undefined) {
        chats = chats.filter(chat => chat.isGroup === args.isGroup);
      }

      // Sort by updatedAt descending for pagination
      chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const totalCount = chats.length;

      // Apply cursor-based pagination
      const paginationParams = PaginationUtil.parseChatPaginationArgs(args);
      
      // Apply cursor filters
      if (paginationParams.afterCursor) {
        chats = chats.filter(chat => 
          chat.updatedAt < paginationParams.afterCursor!.timestamp ||
          (chat.updatedAt.getTime() === paginationParams.afterCursor!.timestamp.getTime() && 
           chat.id < paginationParams.afterCursor!.id)
        );
      }

      if (paginationParams.beforeCursor) {
        chats = chats.filter(chat => 
          chat.updatedAt > paginationParams.beforeCursor!.timestamp ||
          (chat.updatedAt.getTime() === paginationParams.beforeCursor!.timestamp.getTime() && 
           chat.id > paginationParams.beforeCursor!.id)
        );
      }

      // Apply limit
      chats = chats.slice(0, paginationParams.limit);

      // Map to service Chat objects
      const mappedChats = chats.map(chat => this.mapChatEntityToChat(chat));

      LoggerUtil.debug('Found paginated user chats', { 
        userId, 
        count: mappedChats.length, 
        totalCount 
      });

      return PaginationUtil.buildChatConnection(
        mappedChats,
        args,
        totalCount
      );
    } catch (error) {
      LoggerUtil.error('Failed to get user chats connection', error);
      throw error;
    }
  }

  async getUserGroupChats(userId: string): Promise<Chat[]> {
    try {
      const userChats = await this.getUserChats(userId);
      return userChats.filter(chat => chat.isGroup);
    } catch (error) {
      LoggerUtil.error('Failed to get user group chats', error);
      throw error;
    }
  }

  async getUserDirectChats(userId: string): Promise<Chat[]> {
    try {
      const userChats = await this.getUserChats(userId);
      return userChats.filter(chat => !chat.isGroup);
    } catch (error) {
      LoggerUtil.error('Failed to get user direct chats', error);
      throw error;
    }
  }

  async getChatById(chatId: string): Promise<Chat | null> {
    try {
      const chat = await this.chatRepository.findById(chatId);
      return chat ? this.mapChatEntityToChat(chat) : null;
    } catch (error) {
      LoggerUtil.error('Failed to get chat by ID', error);
      throw error;
    }
  }

  async getChatMembers(chatId: string): Promise<ChatMember[]> {
    try {
      LoggerUtil.debug('Getting chat members', { chatId });

      const members = await this.chatMemberRepository.findActiveMembers(chatId);
      
      LoggerUtil.debug('Found chat members', { chatId, count: members.length });
      return members.map(member => this.mapChatMemberEntityToChatMember(member));
    } catch (error) {
      LoggerUtil.error('Failed to get chat members', error);
      throw error;
    }
  }

  async getChatAdmins(chatId: string): Promise<ChatMember[]> {
    try {
      LoggerUtil.debug('Getting chat admins', { chatId });

      const admins = await this.chatMemberRepository.findMembersByRole(chatId, ChatMemberRole.ADMIN);
      
      LoggerUtil.debug('Found chat admins', { chatId, count: admins.length });
      return admins.map(member => this.mapChatMemberEntityToChatMember(member));
    } catch (error) {
      LoggerUtil.error('Failed to get chat admins', error);
      throw error;
    }
  }

  async addMember(chatId: string, userId: string, role: ChatMemberRole = ChatMemberRole.MEMBER): Promise<ChatMember> {
    try {
      LoggerUtil.debug('Adding member to chat', { chatId, userId, role });

      // Check if member already exists
      const existingMember = await this.chatMemberRepository.findByChatAndUser(chatId, userId);
      if (existingMember && existingMember.isActive) {
        throw new Error('User is already a member of this chat');
      }

      // Create new member or reactivate existing
      let member: ChatMemberEntity;
      if (existingMember && !existingMember.isActive) {
        member = await this.chatMemberRepository.update(existingMember.id, {
          isActive: true,
          role,
        }) as ChatMemberEntity;
      } else {
        member = await this.chatMemberRepository.create({
          chatId,
          userId,
          role,
          joinedAt: new Date(),
          isActive: true,
        });
      }

      LoggerUtil.info('Member added to chat successfully', { chatId, userId, memberId: member.id });
      return this.mapChatMemberEntityToChatMember(member);
    } catch (error) {
      LoggerUtil.error('Failed to add member to chat', error);
      throw error;
    }
  }

  async removeMember(chatId: string, userId: string): Promise<boolean> {
    try {
      LoggerUtil.debug('Removing member from chat', { chatId, userId });

      const member = await this.chatMemberRepository.findByChatAndUser(chatId, userId);
      if (!member) {
        LoggerUtil.warn('Cannot remove member - member not found', { chatId, userId });
        return false;
      }

      // Deactivate member instead of deleting
      const updated = await this.chatMemberRepository.update(member.id, { isActive: false });
      
      if (updated) {
        LoggerUtil.info('Member removed from chat successfully', { chatId, userId, memberId: member.id });
        return true;
      }

      return false;
    } catch (error) {
      LoggerUtil.error('Failed to remove member from chat', error);
      throw error;
    }
  }

  async updateMemberRole(chatId: string, userId: string, role: ChatMemberRole): Promise<ChatMember | null> {
    try {
      LoggerUtil.debug('Updating member role', { chatId, userId, role });

      // Business logic: Find member and update role
      const member = await this.chatMemberRepository.findByChatAndUser(chatId, userId);
      if (!member) {
        LoggerUtil.warn('Cannot update role - member not found', { chatId, userId, role });
        return null;
      }

      const updatedMember = await this.chatMemberRepository.update(member.id, { role });
      
      if (updatedMember) {
        LoggerUtil.info('Member role updated successfully', { chatId, userId, role, memberId: updatedMember.id });
        return this.mapChatMemberEntityToChatMember(updatedMember);
      }

      return null;
    } catch (error) {
      LoggerUtil.error('Failed to update member role', error);
      throw error;
    }
  }

  async isUserMemberOfChat(chatId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.chatMemberRepository.findByChatAndUser(chatId, userId);
      return member !== null && member.isActive;
    } catch (error) {
      LoggerUtil.error('Failed to check chat membership', error);
      return false;
    }
  }

  async validateUserChatAccess(userId: string, chatId: string): Promise<void> {
    const hasAccess = await this.isUserMemberOfChat(chatId, userId);
    if (!hasAccess) {
      throw new Error('User does not have access to this chat');
    }
  }

  private mapChatEntityToChat(entity: ChatEntity): Chat {
    const chat: Chat = {
      id: entity.id,
      name: entity.name,
      creatorId: entity.creatorId,
      memberIds: [], // This will be populated separately if needed
      isGroup: entity.isGroup,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };

    // Only include lastMessageId if it exists
    if (entity.lastMessageId) {
      chat.lastMessageId = entity.lastMessageId;
    }

    return chat;
  }

  private mapChatMemberEntityToChatMember(entity: ChatMemberEntity): ChatMember {
    return {
      id: entity.id,
      chatId: entity.chatId,
      userId: entity.userId,
      role: entity.role as 'admin' | 'member',
      joinedAt: entity.joinedAt,
      isActive: entity.isActive,
    };
  }
} 