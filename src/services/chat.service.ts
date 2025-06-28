import { ChatEntity, ChatMemberEntity, ChatMemberRole } from '../database/interfaces/database.interface';
import { MemoryChatMemberRepository } from '../database/repositories/chat-member.repository';
import { MemoryChatRepository } from '../database/repositories/chat.repository';
import { Chat, ChatMember } from '../types';
import { LoggerUtil } from '../utils/logger.util';

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

      const chats = await this.chatRepository.findByMemberId(userId);
      
      LoggerUtil.debug('Found user chats', { userId, count: chats.length });
      return chats.map(chat => this.mapChatEntityToChat(chat));
    } catch (error) {
      LoggerUtil.error('Failed to get user chats', error);
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

      const members = await this.chatMemberRepository.getActiveMembers(chatId);
      
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

      const member = await this.chatMemberRepository.deactivateMember(chatId, userId);
      
      if (member) {
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

      const updatedMember = await this.chatMemberRepository.updateRole(chatId, userId, role);
      
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
      LoggerUtil.error('Failed to check if user is member of chat', error);
      return false;
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