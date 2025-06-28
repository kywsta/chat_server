export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealth(): Promise<DatabaseHealth>;
  healthCheck(): Promise<{
    isHealthy: boolean;
    details?: any;
  }>;
}

export interface DatabaseHealth {
  isHealthy: boolean;
  timestamp: Date;
  details?: any;
}

export interface Repository<T, ID = number> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: ID): Promise<T | null>;
  findAll(options?: FindOptions): Promise<T[]>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
}

export interface FindOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filter?: Record<string, any>;
}

export interface UserRepository extends Repository<UserEntity> {
  findByUsername(username: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  existsByUsername(username: string): Promise<boolean>;
  createUser(userData: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  updatePassword(userId: number, hashedPassword: string): Promise<UserEntity | null>;
  deactivateUser(userId: number): Promise<UserEntity | null>;
  activateUser(userId: number): Promise<UserEntity | null>;
  getActiveUsers(options?: FindOptions): Promise<UserEntity[]>;
}

export interface ChatRepository extends Repository<ChatEntity, string> {
  findByCreatorId(creatorId: string): Promise<ChatEntity[]>;
  findByMemberId(memberId: string): Promise<ChatEntity[]>;
  addMember(chatId: string, userId: string): Promise<void>;
  removeMember(chatId: string, userId: string): Promise<void>;
  getMembers(chatId: string): Promise<string[]>;
  updateLastMessage(chatId: string, messageId: string): Promise<ChatEntity | null>;
  findGroupChats(userId: string): Promise<ChatEntity[]>;
  findDirectChats(userId: string): Promise<ChatEntity[]>;
}

export interface MessageRepository extends Repository<MessageEntity, string> {
  findByChatId(chatId: string, options?: FindOptions): Promise<MessageEntity[]>;
  findByUserId(userId: string, options?: FindOptions): Promise<MessageEntity[]>;
  findReplies(messageId: string): Promise<MessageEntity[]>;
  updateContent(messageId: string, content: string): Promise<MessageEntity | null>;
  getMessageCount(chatId: string): Promise<number>;
  getLatestMessage(chatId: string): Promise<MessageEntity | null>;
  findByType(type: MessageType, options?: FindOptions): Promise<MessageEntity[]>;
}

export interface ChatMemberRepository extends Repository<ChatMemberEntity, string> {
  findByChatId(chatId: string): Promise<ChatMemberEntity[]>;
  findByUserId(userId: string): Promise<ChatMemberEntity[]>;
  findByChatAndUser(chatId: string, userId: string): Promise<ChatMemberEntity | null>;
  updateRole(chatId: string, userId: string, role: ChatMemberRole): Promise<ChatMemberEntity | null>;
  deactivateMember(chatId: string, userId: string): Promise<ChatMemberEntity | null>;
  getActiveMembers(chatId: string): Promise<ChatMemberEntity[]>;
  getAdmins(chatId: string): Promise<ChatMemberEntity[]>;
}

export interface UserEntity {
  id: number;
  username: string;
  email?: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatEntity {
  id: string;
  name: string;
  creatorId: string;
  isGroup: boolean;
  lastMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageEntity {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  type: MessageType;
  replyToId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ChatMemberEntity {
  id: string;
  chatId: string;
  userId: string;
  role: ChatMemberRole;
  joinedAt: Date;
  isActive: boolean;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum ChatMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
} 