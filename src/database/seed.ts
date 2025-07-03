import * as bcrypt from 'bcryptjs';
import { appConfig } from '../config/app.config';
import { LoggerUtil } from '../utils/logger.util';
import { DatabaseManager } from './database.manager';
import { ChatEntity, ChatMemberRole, MessageType, UserEntity } from './interfaces/database.interface';
import { MemoryChatMemberRepository } from './repositories/chat-member.repository';
import { MemoryChatRepository } from './repositories/chat.repository';
import { MemoryMessageRepository } from './repositories/message.repository';

export class DatabaseSeeder {
  private databaseManager: DatabaseManager;
  private chatRepository?: MemoryChatRepository;
  private chatMemberRepository?: MemoryChatMemberRepository;
  private messageRepository?: MemoryMessageRepository;

  constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
  }

  private getChatRepository(): MemoryChatRepository {
    if (!this.chatRepository) {
      this.chatRepository = new MemoryChatRepository(this.databaseManager);
    }
    return this.chatRepository;
  }

  private getChatMemberRepository(): MemoryChatMemberRepository {
    if (!this.chatMemberRepository) {
      this.chatMemberRepository = new MemoryChatMemberRepository(this.databaseManager);
    }
    return this.chatMemberRepository;
  }

  private getMessageRepository(): MemoryMessageRepository {
    if (!this.messageRepository) {
      this.messageRepository = new MemoryMessageRepository(this.databaseManager);
    }
    return this.messageRepository;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async seedDatabase(): Promise<void> {
    try {
      LoggerUtil.info('Starting database seeding...');

      // Seed users first
      const users = await this.seedUsers();
      LoggerUtil.info(`Seeded ${users.length} users`);

      // Seed chats
      const chats = await this.seedChats(users);
      LoggerUtil.info(`Seeded ${chats.length} chats`);

      // Seed messages
      const messageCount = await this.seedMessages(chats, users);
      LoggerUtil.info(`Seeded ${messageCount} messages`);

      LoggerUtil.info('Database seeding completed successfully');
    } catch (error) {
      LoggerUtil.error('Database seeding failed', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<UserEntity[]> {
    const userRepository = this.databaseManager.getUserRepository();
    
    const userData = [
      { username: 'alice', email: 'alice@example.com', password: 'letmepass' },
      { username: 'bob', email: 'bob@example.com', password: 'letmepass' },
      { username: 'charlie', email: 'charlie@example.com', password: 'letmepass' },
      { username: 'diana', email: 'diana@example.com', password: 'letmepass' },
      { username: 'eve', email: 'eve@example.com', password: 'letmepass' },
      { username: 'frank', email: 'frank@example.com', password: 'letmepass' },
      { username: 'grace', email: 'grace@example.com', password: 'letmepass' },
      { username: 'henry', email: 'henry@example.com', password: 'letmepass' },
      { username: 'iris', email: 'iris@example.com', password: 'letmepass' },
      { username: 'jack', email: 'jack@example.com', password: 'letmepass' },
    ];

    const users: UserEntity[] = [];
    for (const user of userData) {
      const hashedPassword = await bcrypt.hash(user.password, appConfig.bcryptSaltRounds);
      const createdUser = await userRepository.createUser({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        isActive: true,
      });
      users.push(createdUser);
    }

    return users;
  }

  private async seedChats(users: UserEntity[]): Promise<ChatEntity[]> {
    const chatRepository = this.getChatRepository();
    const chatMemberRepository = this.getChatMemberRepository();
    const chats: ChatEntity[] = [];

    // Ensure we have enough users
    if (users.length < 10) {
      throw new Error('Not enough users to create chats');
    }

    // Create group chats
    const groupChats = [
      {
        name: 'Team Alpha',
        creatorId: users[0]!.id.toString(),
        memberIds: [users[0]!.id.toString(), users[1]!.id.toString(), users[2]!.id.toString(), users[3]!.id.toString()],
        isGroup: true,
      },
      {
        name: 'Project Beta',
        creatorId: users[1]!.id.toString(),
        memberIds: [users[1]!.id.toString(), users[4]!.id.toString(), users[5]!.id.toString()],
        isGroup: true,
      },
      {
        name: 'Coffee Chat',
        creatorId: users[2]!.id.toString(),
        memberIds: [users[2]!.id.toString(), users[6]!.id.toString(), users[7]!.id.toString(), users[8]!.id.toString(), users[9]!.id.toString()],
        isGroup: true,
      },
    ];

    for (const chatData of groupChats) {
      const chatCreateData = {
        name: chatData.name,
        creatorId: chatData.creatorId,
        isGroup: chatData.isGroup,
      };

      const chat = await chatRepository.create(chatCreateData);
      
      // Set random creation time within last week
      const randomCreatedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      await chatRepository.update(chat.id, { createdAt: randomCreatedAt, updatedAt: randomCreatedAt });
      
      chats.push({ ...chat, createdAt: randomCreatedAt, updatedAt: randomCreatedAt });

      // Create chat members
      for (const memberId of chatData.memberIds) {
        await chatMemberRepository.create({
          chatId: chat.id,
          userId: memberId,
          role: memberId === chatData.creatorId ? ChatMemberRole.ADMIN : ChatMemberRole.MEMBER,
          joinedAt: randomCreatedAt,
          isActive: true,
        });
      }
    }

    // Create direct chats
    const directChatPairs = [
      [users[0]!, users[1]!], // Alice & Bob
      [users[2]!, users[3]!], // Charlie & Diana
      [users[4]!, users[5]!], // Eve & Frank
      [users[6]!, users[7]!], // Grace & Henry
      [users[8]!, users[9]!], // Iris & Jack
    ];

    for (const [user1, user2] of directChatPairs) {
      if (!user1 || !user2) {
        continue; // Skip if either user is undefined
      }

      const chatCreateData = {
        name: `${user1.username} & ${user2.username}`,
        creatorId: user1.id.toString(),
        isGroup: false,
      };

      const chat = await chatRepository.create(chatCreateData);
      
      // Set random creation time within last 2 weeks
      const randomCreatedAt = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      await chatRepository.update(chat.id, { createdAt: randomCreatedAt, updatedAt: randomCreatedAt });
      
      chats.push({ ...chat, createdAt: randomCreatedAt, updatedAt: randomCreatedAt });

      // Create chat members for direct chat
      for (const user of [user1, user2]) {
        if (!user) {
          continue; // Skip if user is undefined
        }

        await chatMemberRepository.create({
          chatId: chat.id,
          userId: user.id.toString(),
          role: ChatMemberRole.MEMBER,
          joinedAt: randomCreatedAt,
          isActive: true,
        });
      }
    }

    return chats;
  }

  private async seedMessages(chats: ChatEntity[], users: UserEntity[]): Promise<number> {
    const chatRepository = this.getChatRepository();
    const chatMemberRepository = this.getChatMemberRepository();
    const messageRepository = this.getMessageRepository();
    let messageCount = 0;

    const sampleMessages: string[] = [
      'Hey everyone! How\'s the project going?',
      'I think we should schedule a meeting for next week.',
      'Great idea! What time works for everyone?',
      'I\'m available Monday through Wednesday.',
      'Let\'s go with Tuesday at 2 PM.',
      'Sounds good to me!',
      'I\'ll send out the meeting invite.',
      'Thanks for organizing this.',
      'No problem! Looking forward to it.',
      'Has anyone reviewed the latest requirements?',
      'Yes, I went through them yesterday.',
      'What did you think?',
      'They look comprehensive, but we might need more time.',
      'I agree. Should we discuss this in the meeting?',
      'Definitely. I\'ll add it to the agenda.',
      'Perfect! See you all on Tuesday.',
      'See you then!',
      'By the way, don\'t forget to bring your laptops.',
      'Got it, thanks for the reminder.',
      'This is going to be a productive meeting.',
    ];

    // Extended messages for Alice & Bob chat
    const aliceBobMessages: string[] = [
      'Hey Alice! How are you doing?',
      'Hi Bob! I\'m doing great, thanks for asking!',
      'That\'s awesome! What have you been up to lately?',
      'Just working on some new projects. How about you?',
      'Same here! I\'ve been learning some new technologies.',
      'That sounds interesting! What kind of technologies?',
      'Mostly GraphQL and real-time messaging stuff.',
      'Oh cool! I\'ve been working with Flutter recently.',
      'Flutter is amazing! Are you building mobile apps?',
      'Yes, I\'m working on a chat application actually.',
      'That\'s a coincidence! I\'m working on the backend for a chat app.',
      'Really? Maybe we should collaborate sometime!',
      'That would be great! I\'d love to see what you\'re building.',
      'I\'ll show you next time we meet.',
      'Sounds like a plan!',
      'By the way, have you tried the new restaurant downtown?',
      'No, I haven\'t. Is it good?',
      'It\'s fantastic! They have amazing pasta.',
      'I love pasta! We should go there together.',
      'Definitely! How about this weekend?',
      'This weekend sounds perfect!',
      'Great! I\'ll make a reservation.',
      'Thanks! I\'m looking forward to it.',
      'Me too! It\'ll be fun to catch up.',
      'Absolutely! See you this weekend then.',
      'See you then!',
      'Oh, and don\'t forget to bring your appetite!',
      'Haha, I won\'t! I\'m always hungry.',
      'Perfect! This is going to be great.',
      'I couldn\'t agree more!',
      'Hey, did you see the latest movie that came out?',
      'Which one are you talking about?',
      'The new sci-fi thriller everyone\'s talking about.',
      'Oh yes! I\'ve been wanting to watch it.',
      'We should go see it after dinner!',
      'That\'s a great idea! A perfect evening.',
      'Exactly! Dinner and a movie.',
      'I can\'t wait! This weekend is going to be amazing.',
      'It really is! Thanks for planning this.',
      'My pleasure! Thanks for being such a great friend.',
      'Aww, you\'re the best Bob!',
      'You\'re pretty awesome yourself, Alice!',
      'This conversation is making me smile.',
      'Same here! I\'m really glad we reconnected.',
      'Me too! We should do this more often.',
      'Absolutely! Regular catch-ups are the best.',
      'I agree! Friends are so important.',
      'They really are. I\'m lucky to have you as a friend.',
      'The feeling is mutual!',
      'Alright, I should probably get back to work.',
      'Same here! But this was really nice.',
      'It was! Talk to you soon!',
      'Talk to you soon, Alice!',
    ];

    for (const chat of chats) {
      // Get chat members
      const members = await chatMemberRepository.findActiveMembers(chat.id);

      if (members.length === 0) continue;

      // Check if this is the Alice & Bob chat
      const isAliceBobChat = chat.name === 'alice & bob' && members.length === 2;
      
      // Generate more messages for Alice & Bob chat, fewer for others
      // For Alice & Bob: use all available messages in the array
      const messagesToUse = isAliceBobChat ? aliceBobMessages : sampleMessages;
      const numMessages = isAliceBobChat ? messagesToUse.length : Math.floor(Math.random() * 10) + 5;
      
      let lastMessageTime = chat.createdAt.getTime();
      let lastMessageId: string | undefined;

      for (let i = 0; i < numMessages; i++) {
        let randomMember;
        let randomMessage;

        if (isAliceBobChat) {
          // For Alice & Bob chat, alternate between users for more realistic conversation
          randomMember = members[i % 2];
          // Use messages in order for Alice & Bob chat to maintain conversation flow
          randomMessage = messagesToUse[i];
        } else {
          randomMember = members[Math.floor(Math.random() * members.length)];
          randomMessage = messagesToUse[Math.floor(Math.random() * messagesToUse.length)];
        }

        // Ensure we have a valid message content
        if (!randomMessage || !randomMember) {
          continue;
        }

        // Add some time variation between messages
        // For Alice & Bob: 2-30 minutes between messages for realistic conversation
        // For others: 5 minutes to 2 hours
        const timeVariation = isAliceBobChat 
          ? Math.random() * 28 * 60 * 1000 + 2 * 60 * 1000  // 2-30 minutes
          : Math.random() * 2 * 60 * 60 * 1000 + 5 * 60 * 1000; // 5 minutes to 2 hours
        
        lastMessageTime += timeVariation;

        const messageCreateData = {
          chatId: chat.id,
          userId: randomMember.userId,
          content: randomMessage,
          type: MessageType.TEXT,
        };

        const message = await messageRepository.create(messageCreateData);
        
        // Update message creation time
        await messageRepository.update(message.id, { createdAt: new Date(lastMessageTime) });
        
        messageCount++;
        lastMessageId = message.id;
      }

      // Update chat's last message and timestamp if we created messages
      if (lastMessageId) {
        await chatRepository.update(chat.id, {
          lastMessageId: lastMessageId,
          updatedAt: new Date(lastMessageTime),
        });
      }
    }

    return messageCount;
  }
} 