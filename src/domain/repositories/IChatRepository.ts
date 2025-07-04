import { ChatEntity } from '../entities';
import { PaginatedChats, PaginationParams, Repository } from './base/Repository';

export interface IChatRepository extends Repository<ChatEntity> {
  findByCreatorId(creatorId: string): Promise<ChatEntity[]>;
  updateLastMessage(chatId: string, messageId: string): Promise<ChatEntity | null>;
  findGroupChats(): Promise<ChatEntity[]>;
  findDirectChats(): Promise<ChatEntity[]>;
  addMemberToChat(chatId: string, userId: string): Promise<ChatEntity | null>;
  removeMemberFromChat(chatId: string, userId: string): Promise<ChatEntity | null>;
  findByMemberId(userId: string): Promise<ChatEntity[]>;
  
  // Pagination methods
  getUserChatsPaginated(
    userId: string,
    params: PaginationParams,
    filters?: { searchTerm?: string; isGroup?: boolean }
  ): Promise<PaginatedChats>;
} 