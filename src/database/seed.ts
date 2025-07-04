import bcrypt from 'bcryptjs';
import { appConfig } from '../config/app.config';
import { ChatEntity, ChatMemberRole, MessageType, UserEntity } from '../domain/entities';
import { IChatMemberRepository, IChatRepository, IMessageRepository } from '../domain/repositories';
import { LoggerUtil } from '../utils/logger.util';
import { DatabaseRepositories } from './database.factory';
import { DatabaseManager } from './database.manager';
import { MemoryDatabase } from './memory_database/memory.database';

export class DatabaseSeeder {
  private databaseManager: DatabaseManager;
  private chatRepository: IChatRepository;
  private chatMemberRepository: IChatMemberRepository;
  private messageRepository: IMessageRepository;

  constructor(databaseManager: DatabaseManager, repositories: DatabaseRepositories) {
    this.databaseManager = databaseManager;
    this.chatRepository = repositories.chatRepository;
    this.chatMemberRepository = repositories.chatMemberRepository;
    this.messageRepository = repositories.messageRepository;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async seed(): Promise<void> {
    LoggerUtil.info('Starting database seeding...');
    
    try {
      const database = this.databaseManager.getDatabase() as MemoryDatabase;
      
      // Clear existing data
      await this.clearDatabase(database);
      
      // Seed users
      await this.seedUsers(database);
      
      // Seed chats
      await this.seedChats(database);
      
      // Seed messages
      await this.seedMessages(database);
      
      // Seed chat members
      await this.seedChatMembers(database);
      
      LoggerUtil.info('Database seeding completed successfully');
    } catch (error) {
      LoggerUtil.error('Database seeding failed', error);
      throw error;
    }
  }

  private async clearDatabase(database: MemoryDatabase): Promise<void> {
    LoggerUtil.info('Clearing existing database data...');
    
    // Clear all collections
    database.getCollection<UserEntity>('users').clear();
    database.getCollection<ChatEntity>('chats').clear();
    database.getCollection('messages').clear();
    database.getCollection('chatMembers').clear();
    
    LoggerUtil.info('Database cleared');
  }

  private async seedUsers(database: MemoryDatabase): Promise<void> {
    LoggerUtil.info('Seeding users...');

    const hashedPassword = await bcrypt.hash('letmepass', appConfig.bcryptSaltRounds);
    
    const users: Omit<UserEntity, 'id'>[] = [
      {
        username: 'alice',
        email: 'alice@example.com',
        password: hashedPassword,
        isActive: true,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: hashedPassword,
        isActive: true,
        createdAt: new Date('2024-01-01T10:15:00Z'),
        updatedAt: new Date('2024-01-01T10:15:00Z'),
      },
      {
        username: 'charlie',
        email: 'charlie@example.com',
        password: hashedPassword,
        isActive: true,
        createdAt: new Date('2024-01-01T10:30:00Z'),
        updatedAt: new Date('2024-01-01T10:30:00Z'),
      },
      {
        username: 'diana',
        email: 'diana@example.com',
        password: hashedPassword,
        isActive: true,
        createdAt: new Date('2024-01-01T10:45:00Z'),
        updatedAt: new Date('2024-01-01T10:45:00Z'),
      },
      {
        username: 'eve',
        email: 'eve@example.com',
        password: hashedPassword,
        isActive: true,
        createdAt: new Date('2024-01-01T11:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      },
      {
        username: 'frank',
        email: 'frank@example.com',
        password: hashedPassword,
        isActive: false, // Inactive user
        createdAt: new Date('2024-01-01T11:15:00Z'),
        updatedAt: new Date('2024-01-01T11:15:00Z'),
      },
    ];

    const userCollection = database.getCollection<UserEntity>('users');
    let id = 1;
    
    for (const userData of users) {
      const user: UserEntity = {
        id: (id++).toString(),
        ...userData,
      };
      userCollection.set(user.id, user);
    }
    
    LoggerUtil.info(`Seeded ${users.length} users`);
  }

  private async seedChats(database: MemoryDatabase): Promise<void> {
    LoggerUtil.info('Seeding chats...');
    
    const chats = [
      {
        id: 'chat_1',
        name: 'General Discussion',
        creatorId: '1',
        memberIds: ['1', '2', '3', '4', '5'],
        isGroup: true,
        lastMessageId: 'msg_5',
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T15:30:00Z'),
      },
      {
        id: 'chat_2',
        name: 'Project Alpha',
        creatorId: '2',
        memberIds: ['2', '3', '4'],
        isGroup: true,
        lastMessageId: 'msg_10',
        createdAt: new Date('2024-01-01T13:00:00Z'),
        updatedAt: new Date('2024-01-01T16:15:00Z'),
      },
      {
        id: 'chat_3',
        name: 'Alice & Bob',
        creatorId: '1',
        memberIds: ['1', '2'],
        isGroup: false,
        lastMessageId: 'msg_15',
        createdAt: new Date('2024-01-01T14:00:00Z'),
        updatedAt: new Date('2024-01-01T17:00:00Z'),
      },
      {
        id: 'chat_4',
        name: 'Team Leaders',
        creatorId: '3',
        memberIds: ['3', '4', '5'],
        isGroup: true,
        lastMessageId: 'msg_20',
        createdAt: new Date('2024-01-01T15:00:00Z'),
        updatedAt: new Date('2024-01-01T18:00:00Z'),
      },
      {
        id: 'chat_5',
        name: 'Charlie & Diana',
        creatorId: '3',
        memberIds: ['3', '4'],
        isGroup: false,
        lastMessageId: 'msg_25',
        createdAt: new Date('2024-01-01T16:00:00Z'),
        updatedAt: new Date('2024-01-01T19:00:00Z'),
      },
    ];

    const chatCollection = database.getCollection<ChatEntity>('chats');
    
    for (const chat of chats) {
      chatCollection.set(chat.id, chat);
    }
    
    LoggerUtil.info(`Seeded ${chats.length} chats`);
  }

  private async seedMessages(database: MemoryDatabase): Promise<void> {
    LoggerUtil.info('Seeding messages...');
    
    const messages = [
      // General Discussion chat messages
      {
        id: 'msg_1',
        chatId: 'chat_1',
        userId: '1',
        content: 'Hello everyone! Welcome to our general discussion chat.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T12:05:00Z'),
      },
      {
        id: 'msg_2',
        chatId: 'chat_1',
        userId: '2',
        content: 'Hi Alice! Great to be here.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T12:10:00Z'),
      },
      {
        id: 'msg_3',
        chatId: 'chat_1',
        userId: '3',
        content: 'Hello team! Looking forward to our collaboration.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T12:15:00Z'),
      },
      {
        id: 'msg_4',
        chatId: 'chat_1',
        userId: '4',
        content: 'Hi everyone! 👋',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T12:20:00Z'),
      },
      {
        id: 'msg_5',
        chatId: 'chat_1',
        userId: '5',
        content: 'Good morning all! Ready to get started on our projects.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T15:30:00Z'),
      },

      // Project Alpha chat messages
      {
        id: 'msg_6',
        chatId: 'chat_2',
        userId: '2',
        content: 'Welcome to Project Alpha team!',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T13:05:00Z'),
      },
      {
        id: 'msg_7',
        chatId: 'chat_2',
        userId: '3',
        content: 'Thanks Bob! What are our first steps?',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T13:10:00Z'),
      },
      {
        id: 'msg_8',
        chatId: 'chat_2',
        userId: '4',
        content: 'I can help with the design phase.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T13:15:00Z'),
      },
      {
        id: 'msg_9',
        chatId: 'chat_2',
        userId: '2',
        content: 'Perfect! Let me share the project requirements.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T13:20:00Z'),
      },
      {
        id: 'msg_10',
        chatId: 'chat_2',
        userId: '3',
        content: 'Received the requirements. They look comprehensive!',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T16:15:00Z'),
      },

      // Alice & Bob direct messages
      {
        id: 'msg_11',
        chatId: 'chat_3',
        userId: '1',
        content: 'Hey Bob, can we discuss the project timeline?',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T14:05:00Z'),
      },
      {
        id: 'msg_12',
        chatId: 'chat_3',
        userId: '2',
        content: 'Sure Alice! I think we can complete it in 3 weeks.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T14:10:00Z'),
      },
      {
        id: 'msg_13',
        chatId: 'chat_3',
        userId: '1',
        content: 'That sounds reasonable. What about the resource allocation?',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T14:15:00Z'),
      },
      {
        id: 'msg_14',
        chatId: 'chat_3',
        userId: '2',
        content: 'I think we need 2 developers and 1 designer.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T14:20:00Z'),
      },
      {
        id: 'msg_15',
        chatId: 'chat_3',
        userId: '1',
        content: 'Agreed! Let me coordinate with the team.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T17:00:00Z'),
      },

      // Team Leaders chat messages
      {
        id: 'msg_16',
        chatId: 'chat_4',
        userId: '3',
        content: 'Team leaders meeting starts now.',
        type: MessageType.SYSTEM,
        createdAt: new Date('2024-01-01T15:05:00Z'),
      },
      {
        id: 'msg_17',
        chatId: 'chat_4',
        userId: '4',
        content: 'Present! Ready to discuss quarterly goals.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T15:10:00Z'),
      },
      {
        id: 'msg_18',
        chatId: 'chat_4',
        userId: '5',
        content: 'Here as well. I have some updates on the client feedback.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T15:15:00Z'),
      },
      {
        id: 'msg_19',
        chatId: 'chat_4',
        userId: '3',
        content: 'Great! Let\'s start with Diana\'s updates.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T15:20:00Z'),
      },
      {
        id: 'msg_20',
        chatId: 'chat_4',
        userId: '4',
        content: 'The client is very satisfied with our progress so far.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T18:00:00Z'),
      },

      // Charlie & Diana direct messages
      {
        id: 'msg_21',
        chatId: 'chat_5',
        userId: '3',
        content: 'Hi Diana, how\'s the design review going?',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T16:05:00Z'),
      },
      {
        id: 'msg_22',
        chatId: 'chat_5',
        userId: '4',
        content: 'Going well! I should have the final version ready by tomorrow.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T16:10:00Z'),
      },
      {
        id: 'msg_23',
        chatId: 'chat_5',
        userId: '3',
        content: 'Perfect! The developers are waiting for it.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T16:15:00Z'),
      },
      {
        id: 'msg_24',
        chatId: 'chat_5',
        userId: '4',
        content: 'I\'ll send it directly to them once it\'s ready.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T16:20:00Z'),
      },
      {
        id: 'msg_25',
        chatId: 'chat_5',
        userId: '3',
        content: 'Thanks Diana! You\'re the best.',
        type: MessageType.TEXT,
        createdAt: new Date('2024-01-01T19:00:00Z'),
      },
    ];

    const messageCollection = database.getCollection('messages');
    
    for (const message of messages) {
      messageCollection.set(message.id, message);
    }
    
    LoggerUtil.info(`Seeded ${messages.length} messages`);
  }

  private async seedChatMembers(database: MemoryDatabase): Promise<void> {
    LoggerUtil.info('Seeding chat members...');
    
    const chatMembers = [
      // General Discussion chat members
      {
        id: 'member_1',
        chatId: 'chat_1',
        userId: '1',
        role: ChatMemberRole.ADMIN,
        joinedAt: new Date('2024-01-01T12:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_2',
        chatId: 'chat_1',
        userId: '2',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T12:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_3',
        chatId: 'chat_1',
        userId: '3',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T12:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_4',
        chatId: 'chat_1',
        userId: '4',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T12:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_5',
        chatId: 'chat_1',
        userId: '5',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T12:00:00Z'),
        isActive: true,
      },

      // Project Alpha chat members
      {
        id: 'member_6',
        chatId: 'chat_2',
        userId: '2',
        role: ChatMemberRole.ADMIN,
        joinedAt: new Date('2024-01-01T13:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_7',
        chatId: 'chat_2',
        userId: '3',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T13:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_8',
        chatId: 'chat_2',
        userId: '4',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T13:00:00Z'),
        isActive: true,
      },

      // Alice & Bob direct chat members
      {
        id: 'member_9',
        chatId: 'chat_3',
        userId: '1',
        role: ChatMemberRole.ADMIN,
        joinedAt: new Date('2024-01-01T14:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_10',
        chatId: 'chat_3',
        userId: '2',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T14:00:00Z'),
        isActive: true,
      },

      // Team Leaders chat members
      {
        id: 'member_11',
        chatId: 'chat_4',
        userId: '3',
        role: ChatMemberRole.ADMIN,
        joinedAt: new Date('2024-01-01T15:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_12',
        chatId: 'chat_4',
        userId: '4',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T15:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_13',
        chatId: 'chat_4',
        userId: '5',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T15:00:00Z'),
        isActive: true,
      },

      // Charlie & Diana direct chat members
      {
        id: 'member_14',
        chatId: 'chat_5',
        userId: '3',
        role: ChatMemberRole.ADMIN,
        joinedAt: new Date('2024-01-01T16:00:00Z'),
        isActive: true,
      },
      {
        id: 'member_15',
        chatId: 'chat_5',
        userId: '4',
        role: ChatMemberRole.MEMBER,
        joinedAt: new Date('2024-01-01T16:00:00Z'),
        isActive: true,
      },
    ];

    const chatMemberCollection = database.getCollection('chatMembers');
    
    for (const member of chatMembers) {
      chatMemberCollection.set(member.id, member);
    }
    
    LoggerUtil.info(`Seeded ${chatMembers.length} chat members`);
  }
} 