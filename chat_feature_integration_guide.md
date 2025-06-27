# Chat Feature Integration Guide - Your Existing Architecture

## 🏗️ Extending Your Current Architecture

Based on your existing project structure, here's how to integrate the chat feature while maintaining your architectural patterns.

## 📋 Step 1: Extend Database Layer

### Update Database Interface
Extend `src/database/interfaces/database.interface.ts`:

```typescript
// Add these methods to your existing DatabaseInterface
export interface DatabaseInterface {
  // ... existing user methods
  
  // Chat methods
  createChat(chat: Chat): Promise<Chat>;
  getChatById(id: string): Promise<Chat | null>;
  getUserChats(userId: string): Promise<Chat[]>;
  addChatMember(chatId: string, userId: string): Promise<void>;
  removeChatMember(chatId: string, userId: string): Promise<void>;
  
  // Message methods
  createMessage(message: Message): Promise<Message>;
  getChatMessages(chatId: string, limit: number, offset: number): Promise<Message[]>;
  updateMessage(id: string, content: string): Promise<Message | null>;
  deleteMessage(id: string): Promise<boolean>;
}
```

### Create Chat Repository
`src/database/repositories/chat.repository.ts`:

```typescript
import { DatabaseInterface } from '../interfaces/database.interface';
import { Chat } from '../../types';

export class ChatRepository {
  constructor(private database: DatabaseInterface) {}

  async createChat(chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chat> {
    const newChat: Chat = {
      id: this.generateId(),
      ...chat,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.database.createChat(newChat);
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return this.database.getUserChats(userId);
  }

  // Follow same pattern as your user.repository.ts
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
```

### Create Message Repository
`src/database/repositories/message.repository.ts`:

```typescript
import { DatabaseInterface } from '../interfaces/database.interface';
import { Message } from '../../types';

export class MessageRepository {
  constructor(private database: DatabaseInterface) {}

  async createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const newMessage: Message = {
      id: this.generateId(),
      ...message,
      createdAt: new Date(),
    };
    return this.database.createMessage(newMessage);
  }

  async getChatMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return this.database.getChatMessages(chatId, limit, offset);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
```

### Extend Memory Database
Update `src/database/memory.database.ts`:

```typescript
export class MemoryDatabase implements DatabaseInterface {
  private users: Map<string, User> = new Map();
  private chats: Map<string, Chat> = new Map();      // Add this
  private messages: Map<string, Message> = new Map(); // Add this
  private chatMembers: Map<string, string[]> = new Map(); // chatId -> userIds

  // ... existing user methods

  // Chat methods
  async createChat(chat: Chat): Promise<Chat> {
    this.chats.set(chat.id, chat);
    this.chatMembers.set(chat.id, chat.memberIds || []);
    return chat;
  }

  async getChatById(id: string): Promise<Chat | null> {
    return this.chats.get(id) || null;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const userChats: Chat[] = [];
    this.chatMembers.forEach((memberIds, chatId) => {
      if (memberIds.includes(userId)) {
        const chat = this.chats.get(chatId);
        if (chat) userChats.push(chat);
      }
    });
    return userChats;
  }

  // Message methods
  async createMessage(message: Message): Promise<Message> {
    this.messages.set(message.id, message);
    return message;
  }

  async getChatMessages(chatId: string, limit: number, offset: number): Promise<Message[]> {
    const chatMessages = Array.from(this.messages.values())
      .filter(msg => msg.chatId === chatId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
    return chatMessages;
  }
}
```

## 🔧 Step 2: Extend Service Layer

### Create Chat Service
`src/services/chat.service.ts`:

```typescript
import { ChatRepository } from '../database/repositories/chat.repository';
import { Chat } from '../types';

export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async createChat(name: string, creatorId: string, memberIds: string[]): Promise<Chat> {
    const chat = {
      name,
      creatorId,
      memberIds: [creatorId, ...memberIds],
      isGroup: memberIds.length > 1,
    };
    return this.chatRepository.createChat(chat);
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return this.chatRepository.getUserChats(userId);
  }

  async addMember(chatId: string, userId: string): Promise<void> {
    // Add business logic for adding members
    // Check permissions, validate user exists, etc.
  }
}
```

### Create Message Service
`src/services/message.service.ts`:

```typescript
import { MessageRepository } from '../database/repositories/message.repository';
import { Message } from '../types';

export class MessageService {
  constructor(private messageRepository: MessageRepository) {}

  async sendMessage(chatId: string, userId: string, content: string): Promise<Message> {
    const message = {
      chatId,
      userId,
      content,
      type: 'text' as const,
    };
    return this.messageRepository.createMessage(message);
  }

  async getChatMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return this.messageRepository.getChatMessages(chatId, limit, offset);
  }
}
```

### Update Service Manager
Update `src/services/service.manager.ts`:

```typescript
import { DatabaseManager } from '../database/database.manager';
import { UserService } from './user.service';
import { ChatService } from './chat.service';        // Add
import { MessageService } from './message.service';  // Add
import { ChatRepository } from '../database/repositories/chat.repository';
import { MessageRepository } from '../database/repositories/message.repository';

export class ServiceManager {
  private userService: UserService;
  private chatService: ChatService;        // Add
  private messageService: MessageService;  // Add

  constructor(private databaseManager: DatabaseManager) {
    this.initializeServices();
  }

  private initializeServices(): void {
    const database = this.databaseManager.getDatabase();
    
    // Existing
    const userRepository = new UserRepository(database);
    this.userService = new UserService(userRepository);
    
    // New services
    const chatRepository = new ChatRepository(database);
    const messageRepository = new MessageRepository(database);
    this.chatService = new ChatService(chatRepository);
    this.messageService = new MessageService(messageRepository);
  }

  getUserService(): UserService {
    return this.userService;
  }

  getChatService(): ChatService {    // Add
    return this.chatService;
  }

  getMessageService(): MessageService {  // Add
    return this.messageService;
  }
}
```

## 📡 Step 3: Add Type Definitions

Update `src/types.ts`:

```typescript
// Add these types to your existing types.ts

export interface Chat {
  id: string;
  name: string;
  creatorId: string;
  memberIds: string[];
  isGroup: boolean;
  lastMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyToId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface GraphQLContext {
  user?: User;
  isAuthenticated: boolean;
}
```

## 🔌 Step 4: GraphQL Integration

### Create GraphQL Context
`src/graphql/context.ts`:

```typescript
import { Request } from 'express';
import { jwtUtil } from '../utils/jwt.util';
import { GraphQLContext } from '../types';

export async function createGraphQLContext({ req }: { req: Request }): Promise<GraphQLContext> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { isAuthenticated: false };
    }

    const decoded = jwtUtil.verifyToken(token);
    return {
      user: decoded,
      isAuthenticated: true,
    };
  } catch (error) {
    return { isAuthenticated: false };
  }
}
```

### Create GraphQL Server
`src/graphql/server.ts`:

```typescript
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { buildSchema } from 'type-graphql';
import { ChatResolver } from './resolvers/ChatResolver';
import { createGraphQLContext } from './context';
import { ServiceManager } from '../services/service.manager';

export async function createGraphQLServer(serviceManager: ServiceManager) {
  const schema = await buildSchema({
    resolvers: [ChatResolver],
    validate: false,
  });

  const server = new ApolloServer({
    schema,
  });

  await server.start();

  return expressMiddleware(server, {
    context: createGraphQLContext,
  });
}
```

## 🚀 Step 5: Integration with Main App

Update `src/index.ts`:

```typescript
import cors from 'cors';
import { createGraphQLServer } from './graphql/server';

// After your existing setup
const serviceManager = new ServiceManager(databaseManager);

// Add GraphQL endpoint
const graphqlMiddleware = await createGraphQLServer(serviceManager);
app.use('/graphql', cors(), graphqlMiddleware);

// Keep your existing REST routes
app.use('/api', routes);
```

## 🎯 Benefits of This Integration

1. **Maintains Your Architecture**: Follows your existing patterns for repositories, services, and database abstraction
2. **Reuses Authentication**: Uses your existing JWT utilities and middleware
3. **Database Agnostic**: Works with your in-memory database now, easy to switch later
4. **Service Layer**: Business logic stays in services, GraphQL just exposes it
5. **Gradual Migration**: REST API continues to work, GraphQL adds new capabilities

## 📝 Next Steps for Cursor Agent

With this foundation, you can now instruct your Cursor agent to:

1. **Implement specific resolvers** using the service layer
2. **Add real-time subscriptions** on top of this architecture
3. **Create GraphQL types** that match your TypeScript interfaces
4. **Add validation and error handling** using your existing patterns

Each piece builds on your existing architecture while adding GraphQL capabilities for the Flutter training course!