import { ChatEntity, ChatMemberEntity, ChatMemberRole } from '../domain/entities';
import { MemoryChatMemberRepository } from '../data/repositories/MemoryChatMemberRepository';
import { MemoryChatRepository } from '../data/repositories/MemoryChatRepository';
import { ChatConnectionArgs } from '../graphql/inputs/ChatConnectionArgs';
import { Chat, ChatMember } from '../types';
import { LoggerUtil } from '../utils/logger.util';
import { PaginationUtil } from '../utils/pagination.util';
import { IChatMemberRepository, IChatRepository } from '../domain';

export class ChatService {
  private chatRepository: IChatRepository;
  private chatMemberRepository: IChatMemberRepository;

  constructor(
    chatRepository: IChatRepository,
    chatMemberRepository: IChatMemberRepository
  ) {
    this.chatRepository = chatRepository;
    this.chatMemberRepository = chatMemberRepository;
  }

  async createChat(name: string, creatorId: string, memberIds: string[] = [], isGroup: boolean = true): Promise<Chat> {
    try {
      LoggerUtil.debug('Creating chat', { name, creatorId, memberIds, isGroup });

      // Include creator in memberIds if not already present
      const allMemberIds = memberIds.includes(creatorId) ? memberIds : [creatorId, ...memberIds];

      // Create the chat with memberIds
      const chatData = {
        name,
        creatorId,
        memberIds: allMemberIds,
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

  async getChats(userId: string, args: ChatConnectionArgs) {
    try {
      LoggerUtil.debug('Getting user chats with pagination', { userId, first: args.first, after: args.after });

      // Parse pagination arguments
      const paginationParams = PaginationUtil.parseChatPaginationArgs(args);
      
      // Build filters
      const filters: { searchTerm?: string; isGroup?: boolean } = {};
      if (args.searchTerm) {
        filters.searchTerm = args.searchTerm;
      }
      if (args.isGroup || args.isGroup === false) {
        filters.isGroup = args.isGroup;
      }

      // Delegate to repository for database operations
      const result = await this.chatRepository.getUserChatsPaginated(
        userId,
        paginationParams,
        filters
      );

      // Map to service Chat objects
      const mappedChats = result.chats.map(chat => this.mapChatEntityToChat(chat));

      LoggerUtil.debug('Found paginated user chats', { 
        userId, 
        count: mappedChats.length, 
        totalCount: result.totalCount 
      });

      return PaginationUtil.buildChatConnection(
        mappedChats,
        args,
        result.totalCount
      );
    } catch (error) {
      LoggerUtil.error('Failed to get user chats connection', error);
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

  async addMember(chatId: string, userId: string, role: ChatMemberRole = ChatMemberRole.MEMBER): Promise<ChatMember> {
    try {
      LoggerUtil.debug('Adding member to chat', { chatId, userId, role });

      // Check if member already exists
      const existingMember = await this.chatMemberRepository.findByChatAndUser(chatId, userId);
      if (existingMember && existingMember.isActive) {
        throw new Error('User is already a member of this chat');
      }

      // Add user to chat memberIds array
      await this.chatRepository.addMemberToChat(chatId, userId);

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

      // Remove user from chat memberIds array
      await this.chatRepository.removeMemberFromChat(chatId, userId);

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
      // Use memberIds array for faster access control
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        return false;
      }
      
      return chat.memberIds.includes(userId);
    } catch (error) {
      LoggerUtil.error('Failed to check chat membership', error);
      return false;
    }
  }

  private mapChatEntityToChat(entity: ChatEntity): Chat {
    const chat: Chat = {
      id: entity.id,
      name: entity.name,
      creatorId: entity.creatorId,
      memberIds: entity.memberIds,
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