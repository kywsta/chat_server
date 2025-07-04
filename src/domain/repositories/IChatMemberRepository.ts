import { ChatMemberEntity, ChatMemberRole } from '../entities';
import { Repository } from './base/Repository';

export interface IChatMemberRepository extends Repository<ChatMemberEntity> {
  findByChatId(chatId: string): Promise<ChatMemberEntity[]>;
  findByUserId(userId: string): Promise<ChatMemberEntity[]>;
  findByChatAndUser(chatId: string, userId: string): Promise<ChatMemberEntity | null>;
  findActiveMembers(chatId: string): Promise<ChatMemberEntity[]>;
  findMembersByRole(chatId: string, role: ChatMemberRole): Promise<ChatMemberEntity[]>;
} 