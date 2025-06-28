# Architecture Preservation Rules - Chat Server Development

## 🎯 Purpose

This document establishes **non-negotiable rules** for maintaining clean architecture during the development of real-time chat features. These rules ensure code quality, maintainability, and consistency with existing patterns.

---

## 🏗️ Core Architecture Principles

### 1. Layer Separation (MANDATORY)

The application follows strict layered architecture:

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (Controllers + GraphQL Resolvers)│
├─────────────────────────────────────┤
│        Business Logic Layer         │
│           (Services)                │
├─────────────────────────────────────┤
│        Data Access Layer            │
│         (Repositories)              │
├─────────────────────────────────────┤
│        Infrastructure Layer         │
│    (Database + External Services)   │
└─────────────────────────────────────┘
```

**Rule**: Each layer can ONLY communicate with the layer directly below it.

---

## 🚫 CRITICAL VIOLATIONS - Never Do These

### ❌ Violation 1: Layer Bypassing

```typescript
// ❌ FORBIDDEN: Direct database access from resolver
@Resolver()
export class ChatResolver {
  constructor(private database: DatabaseInterface) {} // WRONG!
  
  @Query(() => [Message])
  async getMessages() {
    return this.database.findMessages(); // VIOLATES ARCHITECTURE
  }
}

// ✅ CORRECT: Through service layer
@Resolver()
export class ChatResolver {
  constructor(private chatService: ChatService) {} // CORRECT!
  
  @Query(() => [Message])
  async getMessages(@Ctx() context: GraphQLContext) {
    return this.chatService.getMessages(context.user.id); // FOLLOWS ARCHITECTURE
  }
}
```

### ❌ Violation 2: Business Logic in Presentation Layer

```typescript
// ❌ FORBIDDEN: Business logic in resolver
@Mutation(() => Message)
async sendMessage(@Arg("input") input: SendMessageInput) {
  // Business logic in resolver - WRONG!
  if (input.content.length > 1000) {
    throw new Error("Message too long");
  }
  
  const message = {
    id: generateId(),
    content: input.content,
    createdAt: new Date(),
  };
  
  return this.messageRepository.create(message); // WRONG!
}

// ✅ CORRECT: Delegate to service
@Mutation(() => Message)
async sendMessage(@Arg("input") input: SendMessageInput, @Ctx() context: GraphQLContext) {
  return this.messageService.sendMessage(input, context.user.id); // CORRECT!
}
```

### ❌ Violation 3: Authentication Bypass

```typescript
// ❌ FORBIDDEN: Creating new auth mechanisms
@Subscription(() => Message)
async messageAdded(@Arg("token") token: string) {
  const user = jwt.verify(token, process.env.JWT_SECRET); // WRONG!
  // ... subscription logic
}

// ✅ CORRECT: Use existing auth context
@Subscription(() => Message)
async messageAdded(@Arg("chatId") chatId: string, @Ctx() context: GraphQLContext) {
  if (!context.isAuthenticated) {
    throw new Error("Unauthorized");
  }
  // ... subscription logic
}
```

### ❌ Violation 4: Service Manager Bypass

```typescript
// ❌ FORBIDDEN: Direct service instantiation
export class ChatResolver {
  private chatService: ChatService;
  
  constructor() {
    const database = new MemoryDatabase(); // WRONG!
    const chatRepository = new ChatRepository(database); // WRONG!
    this.chatService = new ChatService(chatRepository); // WRONG!
  }
}

// ✅ CORRECT: Use service manager
export class ChatResolver {
  constructor(private serviceManager: ServiceManager) {} // CORRECT!
  
  @Query(() => [Chat])
  async getUserChats(@Ctx() context: GraphQLContext) {
    const chatService = this.serviceManager.getChatService(); // CORRECT!
    return chatService.getUserChats(context.user.id);
  }
}
```

---

## ✅ Mandatory Patterns to Follow

### 1. Repository Pattern Implementation

```typescript
// ✅ CORRECT: Repository structure
export class MessageRepository {
  constructor(private database: DatabaseInterface) {}
  
  async create(message: Omit<MessageEntity, 'id' | 'createdAt'>): Promise<MessageEntity> {
    const entity: MessageEntity = {
      id: this.generateId(),
      ...message,
      createdAt: new Date(),
    };
    return this.database.createMessage(entity);
  }
  
  async findByChatId(chatId: string): Promise<MessageEntity[]> {
    return this.database.findMessagesByChatId(chatId);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
```

### 2. Service Layer Implementation

```typescript
// ✅ CORRECT: Service structure
export class MessageService {
  constructor(
    private messageRepository: MessageRepository,
    private chatRepository: ChatRepository,
    private pubSubService: PubSubService
  ) {}
  
  async sendMessage(input: SendMessageInput, userId: string): Promise<MessageEntity> {
    // 1. Validate business rules
    await this.validateMessageInput(input);
    
    // 2. Check permissions
    await this.validateUserChatAccess(userId, input.chatId);
    
    // 3. Create message
    const message = await this.messageRepository.create({
      chatId: input.chatId,
      userId,
      content: input.content,
      type: 'text',
    });
    
    // 4. Trigger real-time updates
    await this.pubSubService.publishMessageAdded(message);
    
    return message;
  }
  
  private async validateMessageInput(input: SendMessageInput): Promise<void> {
    if (!input.content || input.content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }
    
    if (input.content.length > 1000) {
      throw new Error("Message content too long");
    }
  }
}
```

### 3. GraphQL Resolver Implementation

```typescript
// ✅ CORRECT: Resolver structure
@Resolver(Message)
export class ChatResolver {
  constructor(private serviceManager: ServiceManager) {}
  
  @Query(() => [Message])
  async getChatMessages(
    @Arg("chatId") chatId: string,
    @Arg("limit", { defaultValue: 50 }) limit: number,
    @Arg("offset", { defaultValue: 0 }) offset: number,
    @Ctx() context: GraphQLContext
  ): Promise<MessageEntity[]> {
    const messageService = this.serviceManager.getMessageService();
    return messageService.getChatMessages(chatId, limit, offset, context.user.id);
  }
  
  @Mutation(() => Message)
  async sendMessage(
    @Arg("input") input: SendMessageInput,
    @Ctx() context: GraphQLContext
  ): Promise<MessageEntity> {
    const messageService = this.serviceManager.getMessageService();
    return messageService.sendMessage(input, context.user.id);
  }
  
  @Subscription(() => Message, {
    topics: ({ args }) => `MESSAGE_ADDED_${args.chatId}`,
    filter: ({ payload, args, context }) => {
      // Ensure user has access to this chat
      return context.isAuthenticated && payload.chatId === args.chatId;
    }
  })
  async messageAdded(
    @Arg("chatId") chatId: string,
    @Ctx() context: GraphQLContext
  ): Promise<MessageEntity> {
    const chatService = this.serviceManager.getChatService();
    await chatService.validateUserChatAccess(context.user.id, chatId);
    
    return context.payload;
  }
}
```

### 4. Database Interface Extension

```typescript
// ✅ CORRECT: Interface extension
export interface DatabaseInterface {
  // Existing methods...
  createUser(user: UserEntity): Promise<UserEntity>;
  findUserById(id: number): Promise<UserEntity | null>;
  
  // New methods following same patterns
  createMessage(message: MessageEntity): Promise<MessageEntity>;
  findMessagesByChatId(chatId: string): Promise<MessageEntity[]>;
  updateMessageContent(id: string, content: string): Promise<MessageEntity | null>;
  deleteMessage(id: string): Promise<boolean>;
  
  // Subscription-related methods
  findActiveChatMembers(chatId: string): Promise<ChatMemberEntity[]>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
}
```

---

## 🔧 Service Manager Integration Rules

### Rule 1: Always Use Service Manager for Dependencies

```typescript
// ✅ CORRECT: Service manager integration
export class ServiceManager {
  private userService: UserService;
  private chatService: ChatService;
  private messageService: MessageService;
  private pubSubService: PubSubService; // Add new services here
  
  constructor(private databaseManager: DatabaseManager) {
    this.initializeServices();
  }
  
  private initializeServices(): void {
    const database = this.databaseManager.getDatabase();
    
    // Initialize repositories
    const userRepository = new UserRepository(database);
    const chatRepository = new ChatRepository(database);
    const messageRepository = new MessageRepository(database);
    
    // Initialize PubSub
    const pubSub = new PubSub();
    this.pubSubService = new PubSubService(pubSub);
    
    // Initialize services with dependencies
    this.userService = new UserService(userRepository);
    this.chatService = new ChatService(chatRepository, userRepository);
    this.messageService = new MessageService(
      messageRepository,
      chatRepository,
      this.pubSubService
    );
  }
  
  // Getters for services
  getUserService(): UserService { return this.userService; }
  getChatService(): ChatService { return this.chatService; }
  getMessageService(): MessageService { return this.messageService; }
  getPubSubService(): PubSubService { return this.pubSubService; }
}
```

### Rule 2: Resolver Constructor Pattern

```typescript
// ✅ CORRECT: Single dependency injection
@Resolver()
export class ChatResolver {
  constructor(private serviceManager: ServiceManager) {}
  
  // All service access through service manager
  @Query(() => [Chat])
  async getUserChats(@Ctx() context: GraphQLContext) {
    return this.serviceManager.getChatService().getUserChats(context.user.id);
  }
}
```

---

## 🔐 Authentication Integration Rules

### Rule 1: Always Use Existing Auth Context

```typescript
// ✅ CORRECT: GraphQL context usage
export interface GraphQLContext {
  user?: UserEntity;
  isAuthenticated: boolean;
}

// ✅ CORRECT: Context creation
export async function createGraphQLContext({ req }: { req: Request }): Promise<GraphQLContext> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { isAuthenticated: false };
    }
    
    // Use existing JWT utility
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

### Rule 2: WebSocket Authentication Extension

```typescript
// ✅ CORRECT: WebSocket auth following existing patterns
export function createWebSocketContext(ctx: Context): GraphQLContext {
  try {
    const token = ctx.connectionParams?.authorization?.replace('Bearer ', '');
    if (!token) {
      return { isAuthenticated: false };
    }
    
    // Reuse existing JWT utility
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

---

## 📝 Type Definition Rules

### Rule 1: Extend Existing Types File

```typescript
// ✅ CORRECT: Add to existing src/types.ts
export interface MessageEntity {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyToId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Subscription payload types
export interface MessageAddedPayload {
  messageAdded: MessageEntity;
}

export interface UserTypingPayload {
  userTyping: {
    chatId: string;
    userId: string;
    isTyping: boolean;
  };
}
```

### Rule 2: GraphQL Type Definitions

```typescript
// ✅ CORRECT: Type-GraphQL decorators
@ObjectType()
export class Message {
  @Field(() => ID)
  id: string;
  
  @Field()
  chatId: string;
  
  @Field()
  userId: string;
  
  @Field()
  content: string;
  
  @Field(() => MessageType)
  type: MessageType;
  
  @Field(() => String, { nullable: true })
  replyToId?: string;
  
  @Field(() => Date)
  createdAt: Date;
  
  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

@registerEnumType(MessageType, {
  name: "MessageType",
})
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  SYSTEM = "system",
}
```

---

## 🚨 Pre-Implementation Checklist

Before implementing any new feature, verify:

### ✅ Architecture Compliance
- [ ] Identified which layer needs extension
- [ ] Checked existing patterns in similar files
- [ ] Planned service manager integration
- [ ] Considered database interface changes
- [ ] Verified authentication requirements

### ✅ Code Quality
- [ ] Following TypeScript strict mode
- [ ] Using existing error handling patterns
- [ ] Maintaining consistent naming conventions
- [ ] Adding proper type definitions
- [ ] Including appropriate validation

### ✅ Testing Strategy
- [ ] Can mock dependencies easily
- [ ] Business logic testable in isolation
- [ ] Integration points clearly defined
- [ ] Authentication flows testable

---

## 🎯 Success Metrics

### Architectural Integrity
1. **Layer Isolation**: No cross-layer dependencies
2. **Service Cohesion**: Related functionality grouped in services
3. **Repository Consistency**: All data access through repositories
4. **Authentication Unity**: Single auth system throughout

### Code Quality
1. **Type Safety**: 100% TypeScript coverage
2. **Error Handling**: Consistent error patterns
3. **Validation**: Input validation at service layer
4. **Documentation**: Clear interfaces and contracts

### Maintainability
1. **Pattern Consistency**: New code follows existing patterns
2. **Dependency Management**: Clear dependency injection
3. **Testing Support**: Easy to unit test
4. **Extensibility**: Easy to add new features

---

## 📋 Quick Reference Checklist

### For Every New Feature:
```
□ Extends existing layer, doesn't bypass
□ Uses service manager for dependencies
□ Follows existing authentication patterns
□ Adds types to existing types.ts
□ Includes proper error handling
□ Business logic in service layer
□ Data access through repositories
□ GraphQL context for user access
□ Consistent with existing patterns
□ TypeScript strict mode compliant
```

### Red Flags to Stop Development:
```
🚨 Direct database access from resolver
🚨 New authentication mechanism
🚨 Business logic in presentation layer
🚨 Service instantiation outside manager
🚨 GraphQL context not used for auth
🚨 Bypassing existing repositories
🚨 Creating parallel type definitions
🚨 Ignoring existing error patterns
```

---

## 💡 Remember

> "The architecture is already proven and working. Your job is to extend it, not rebuild it. Every new feature should feel like a natural extension of what's already there."

**When in doubt**: Look at existing implementations and follow the same patterns. Consistency is more valuable than innovation in architecture.