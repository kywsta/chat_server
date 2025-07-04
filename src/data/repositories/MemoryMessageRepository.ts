import {
  MemoryDatabase,
  MemoryRepository,
} from "../../database/memory_database/memory.database";
import { QueryBuilder } from "../../database/memory_database/query-builder.util";
import { MessageEntity, MessageType } from "../../domain/entities";
import {
  FindOptions,
  IMessageRepository,
  PaginatedMessages,
  PaginationParams,
} from "../../domain/repositories";

export class MemoryMessageRepository
  extends MemoryRepository<MessageEntity>
  implements IMessageRepository
{
  constructor(database: MemoryDatabase) {
    super(database, "messages");
  }

  // Message-specific query methods
  async findByChatId(
    chatId: string,
    options?: FindOptions
  ): Promise<MessageEntity[]> {
    const mergedOptions = {
      ...options,
      filter: { ...options?.filter, chatId },
      orderBy: options?.orderBy || "createdAt",
      orderDirection: options?.orderDirection || "DESC",
    };
    return this.findAll(mergedOptions);
  }

  async findByUserId(
    userId: string,
    options?: FindOptions
  ): Promise<MessageEntity[]> {
    const mergedOptions = {
      ...options,
      filter: { ...options?.filter, userId },
      orderBy: options?.orderBy || "createdAt",
      orderDirection: options?.orderDirection || "DESC",
    };
    return this.findAll(mergedOptions);
  }

  async findReplies(messageId: string): Promise<MessageEntity[]> {
    return this.findAll({
      filter: { replyToId: messageId },
      orderBy: "createdAt",
      orderDirection: "ASC",
    });
  }

  async updateContent(
    messageId: string,
    content: string
  ): Promise<MessageEntity | null> {
    return this.update(messageId, {
      content,
      updatedAt: new Date(),
    });
  }

  async getMessageCount(chatId: string): Promise<number> {
    return this.count({ chatId });
  }

  async getLatestMessage(chatId: string): Promise<MessageEntity | null> {
    const messages = await this.findByChatId(chatId, { limit: 1 });
    return messages[0] || null;
  }

  async findByType(
    type: MessageType,
    options?: FindOptions
  ): Promise<MessageEntity[]> {
    const mergedOptions = {
      ...options,
      filter: { ...options?.filter, type },
      orderBy: options?.orderBy || "createdAt",
      orderDirection: options?.orderDirection || "DESC",
    };
    return this.findAll(mergedOptions);
  }

  // Pagination methods
  async getChatMessagesPaginated(
    chatId: string,
    params: PaginationParams
  ): Promise<PaginatedMessages> {
    const queryBuilder = QueryBuilder.create()
      .whereEquals("chatId", chatId)
      .orderBy("createdAt", params.direction === "forward" ? "ASC" : "DESC");

    if (params.afterCursor) {
      queryBuilder.whereGreaterThan("createdAt", params.afterCursor!.timestamp);
    }

    if (params.beforeCursor) {
      queryBuilder.whereLessThan("createdAt", params.beforeCursor!.timestamp);
    }

    const options = queryBuilder.limit(params.limit).build();

    const messages = await this.findAll(options);

    const totalCount = await this.getMessageCount(chatId);

    return { messages, totalCount };
  }
}
