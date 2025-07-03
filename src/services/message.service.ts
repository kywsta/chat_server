import { MessageEntity, MessageType } from '../database/interfaces/database.interface';
import { MemoryChatRepository } from '../database/repositories/chat.repository';
import { MemoryMessageRepository } from '../database/repositories/message.repository';
import { MessageConnectionArgs } from '../graphql/inputs/MessageConnectionArgs';
import { Message } from '../types';
import { LoggerUtil } from '../utils/logger.util';
import { PaginationUtil } from '../utils/pagination.util';

export class MessageService {
  private messageRepository: MemoryMessageRepository;
  private chatRepository: MemoryChatRepository;

  constructor(
    messageRepository: MemoryMessageRepository,
    chatRepository: MemoryChatRepository
  ) {
    this.messageRepository = messageRepository;
    this.chatRepository = chatRepository;
  }

  async sendMessage(
    chatId: string, 
    userId: string, 
    content: string, 
    type: MessageType = MessageType.TEXT,
    replyToId?: string
  ): Promise<Message> {
    try {
      LoggerUtil.debug('Sending message', { chatId, userId, content: content.substring(0, 50), type });

      // Business logic: Validate user access to chat
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      if (!chat.memberIds.includes(userId)) {
        throw new Error('User is not a member of this chat');
      }

      // Business logic: Validate message content
      if (!content || content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }

      if (content.length > 1000) {
        throw new Error('Message content too long');
      }

      // Create message data
      const messageData: Omit<MessageEntity, 'id' | 'createdAt' | 'updatedAt'> = {
        chatId,
        userId,
        content,
        type,
      };

      // Only include replyToId if it exists
      if (replyToId) {
        messageData.replyToId = replyToId;
      }

      const message = await this.messageRepository.create(messageData);

      // Business logic: Update chat's last message
      try {
        await this.chatRepository.updateLastMessage(chatId, message.id);
        LoggerUtil.debug('Updated chat last message', { chatId, messageId: message.id });
      } catch (error) {
        LoggerUtil.error('Failed to update chat last message', error);
        // Don't throw here - message creation should still succeed
      }

      LoggerUtil.info('Message sent successfully', { 
        messageId: message.id, 
        chatId: message.chatId, 
        userId: message.userId 
      });

      return this.mapMessageEntityToMessage(message);
    } catch (error) {
      LoggerUtil.error('Failed to send message', error);
      throw error;
    }
  }

  async getChatMessages(args: MessageConnectionArgs, userId: string) {
    try {
      LoggerUtil.debug('Getting chat messages with pagination', { chatId: args.chatId, first: args.first, after: args.after });

      // Business logic: Validate user access to chat
      const chat = await this.chatRepository.findById(args.chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      if (!chat.memberIds.includes(userId)) {
        throw new Error('User is not a member of this chat');
      }

      const paginationParams = PaginationUtil.parsePaginationArgs(args);
      const result = await this.messageRepository.getChatMessagesPaginated(
        args.chatId,
        paginationParams
      );

      LoggerUtil.debug('Found paginated chat messages', { 
        chatId: args.chatId, 
        count: result.messages.length, 
        totalCount: result.totalCount 
      });

      return PaginationUtil.buildConnection(
        result.messages,
        args,
        result.totalCount,
        paginationParams.direction
      );
    } catch (error) {
      LoggerUtil.error('Failed to get chat messages connection', error);
      throw error;
    }
  }

  async updateMessage(messageId: string, content: string): Promise<Message | null> {
    try {
      LoggerUtil.debug('Updating message', { messageId, content: content.substring(0, 50) });

      const updatedMessage = await this.messageRepository.updateContent(messageId, content);
      
      if (updatedMessage) {
        LoggerUtil.info('Message updated successfully', { messageId });
        return this.mapMessageEntityToMessage(updatedMessage);
      }

      return null;
    } catch (error) {
      LoggerUtil.error('Failed to update message', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      LoggerUtil.debug('Deleting message', { messageId });

      const deleted = await this.messageRepository.delete(messageId);
      
      if (deleted) {
        LoggerUtil.info('Message deleted successfully', { messageId });
      }

      return deleted;
    } catch (error) {
      LoggerUtil.error('Failed to delete message', error);
      throw error;
    }
  }

  private mapMessageEntityToMessage(entity: MessageEntity): Message {
    const message: Message = {
      id: entity.id,
      chatId: entity.chatId,
      userId: entity.userId,
      content: entity.content,
      type: entity.type as 'text' | 'image' | 'file' | 'system',
      createdAt: entity.createdAt,
    };

    // Only include optional properties if they exist
    if (entity.replyToId) {
      message.replyToId = entity.replyToId;
    }

    if (entity.updatedAt) {
      message.updatedAt = entity.updatedAt;
    }

    return message;
  }
} 