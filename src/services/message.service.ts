import { MessageEntity, MessageType } from '../database/interfaces/database.interface';
import { MemoryChatRepository } from '../database/repositories/chat.repository';
import { MemoryMessageRepository } from '../database/repositories/message.repository';
import { Message } from '../types';
import { LoggerUtil } from '../utils/logger.util';

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
      LoggerUtil.debug('Sending message', { chatId, userId, content: content.substring(0, 50), type, replyToId });

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

  async getChatMessages(
    chatId: string, 
    limit: number = 50, 
    offset: number = 0,
    userId?: string
  ): Promise<Message[]> {
    try {
      LoggerUtil.debug('Getting chat messages', { chatId, limit, offset, userId });

      // For chat apps: Get most recent messages first (DESC), then reverse for display
      // This allows proper pagination where offset=0 gets latest messages
      const messages = await this.messageRepository.findByChatId(chatId, {
        limit,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      });

      // Reverse the messages so they appear in chronological order (oldest first)
      // This way the client displays them naturally: older messages at top, newer at bottom
      const orderedMessages = messages.reverse();

      LoggerUtil.debug('Found chat messages', { chatId, count: orderedMessages.length });
      return orderedMessages.map(message => this.mapMessageEntityToMessage(message));
    } catch (error) {
      LoggerUtil.error('Failed to get chat messages', error);
      throw error;
    }
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    try {
      const message = await this.messageRepository.findById(messageId);
      return message ? this.mapMessageEntityToMessage(message) : null;
    } catch (error) {
      LoggerUtil.error('Failed to get message by ID', error);
      throw error;
    }
  }

  async getUserMessages(userId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      LoggerUtil.debug('Getting user messages', { userId, limit, offset });

      const messages = await this.messageRepository.findByUserId(userId, {
        limit,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      });

      LoggerUtil.debug('Found user messages', { userId, count: messages.length });
      return messages.map(message => this.mapMessageEntityToMessage(message));
    } catch (error) {
      LoggerUtil.error('Failed to get user messages', error);
      throw error;
    }
  }

  async getMessageReplies(messageId: string): Promise<Message[]> {
    try {
      LoggerUtil.debug('Getting message replies', { messageId });

      const replies = await this.messageRepository.findReplies(messageId);

      LoggerUtil.debug('Found message replies', { messageId, count: replies.length });
      return replies.map(reply => this.mapMessageEntityToMessage(reply));
    } catch (error) {
      LoggerUtil.error('Failed to get message replies', error);
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

  async getChatMessageCount(chatId: string): Promise<number> {
    try {
      const count = await this.messageRepository.getMessageCount(chatId);
      LoggerUtil.debug('Got chat message count', { chatId, count });
      return count;
    } catch (error) {
      LoggerUtil.error('Failed to get chat message count', error);
      throw error;
    }
  }

  async getLatestChatMessage(chatId: string): Promise<Message | null> {
    try {
      const message = await this.messageRepository.getLatestMessage(chatId);
      return message ? this.mapMessageEntityToMessage(message) : null;
    } catch (error) {
      LoggerUtil.error('Failed to get latest chat message', error);
      throw error;
    }
  }

  async getMessagesByType(type: MessageType, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      LoggerUtil.debug('Getting messages by type', { type, limit, offset });

      const messages = await this.messageRepository.findByType(type, {
        limit,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      });

      LoggerUtil.debug('Found messages by type', { type, count: messages.length });
      return messages.map(message => this.mapMessageEntityToMessage(message));
    } catch (error) {
      LoggerUtil.error('Failed to get messages by type', error);
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