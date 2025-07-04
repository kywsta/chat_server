import {
  MemoryDatabase,
  MemoryRepository,
} from "../../database/memory_database/memory.database";
import { ChatMemberEntity, ChatMemberRole } from "../../domain/entities";
import { IChatMemberRepository } from "../../domain/repositories";
import { LoggerUtil } from "../../utils/logger.util";

export class MemoryChatMemberRepository
  extends MemoryRepository<ChatMemberEntity>
  implements IChatMemberRepository
{
  constructor(database: MemoryDatabase) {
    super(database, "chats");
  }

  override async create(
    data: Omit<ChatMemberEntity, "id" | "createdAt" | "updatedAt">
  ): Promise<ChatMemberEntity> {
    // ChatMemberEntity uses joinedAt, not createdAt, so we need to handle this properly
    const memberData = {
      ...data,
      joinedAt: new Date(),
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    const member = await this.create(memberData);
    LoggerUtil.debug("Chat member created", {
      memberId: member.id,
      chatId: member.chatId,
      userId: member.userId,
      role: member.role,
    });
    return member;
  }

  // ChatMember-specific query methods
  async findByChatId(chatId: string): Promise<ChatMemberEntity[]> {
    return this.findAll({
      filter: { chatId },
      orderBy: "joinedAt",
      orderDirection: "ASC",
    });
  }

  async findByUserId(userId: string): Promise<ChatMemberEntity[]> {
    return this.findAll({
      filter: { userId },
      orderBy: "joinedAt",
      orderDirection: "DESC",
    });
  }

  async findByChatAndUser(
    chatId: string,
    userId: string
  ): Promise<ChatMemberEntity | null> {
    const members = await this.findAll({
      filter: { chatId, userId },
    });
    return members[0] || null;
  }

  async findActiveMembers(chatId: string): Promise<ChatMemberEntity[]> {
    return this.findAll({
      filter: { chatId, isActive: true },
      orderBy: "joinedAt",
      orderDirection: "ASC",
    });
  }

  async findMembersByRole(
    chatId: string,
    role: ChatMemberRole
  ): Promise<ChatMemberEntity[]> {
    return this.findAll({
      filter: { chatId, role, isActive: true },
      orderBy: "joinedAt",
      orderDirection: "ASC",
    });
  }
}
