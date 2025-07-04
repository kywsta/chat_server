import { MessageEntity, MessageType } from '../entities';
import { FindOptions, PaginatedMessages, PaginationParams, Repository } from './base/Repository';

export interface IMessageRepository extends Repository<MessageEntity> {
  findByChatId(chatId: string, options?: FindOptions): Promise<MessageEntity[]>;
  findByUserId(userId: string, options?: FindOptions): Promise<MessageEntity[]>;
  findReplies(messageId: string): Promise<MessageEntity[]>;
  updateContent(messageId: string, content: string): Promise<MessageEntity | null>;
  getMessageCount(chatId: string): Promise<number>;
  getLatestMessage(chatId: string): Promise<MessageEntity | null>;
  findByType(type: MessageType, options?: FindOptions): Promise<MessageEntity[]>;
  
  // Pagination methods
  getChatMessagesPaginated(chatId: string, params: PaginationParams): Promise<PaginatedMessages>;
} 