# Express.js TypeScript Chat Server - Comprehensive Architecture

## 🏗️ Overview

This is a modern Express.js chat server built with TypeScript, featuring both REST and GraphQL APIs, JWT authentication, and a layered architecture designed for scalability and maintainability. The project follows clean architecture principles with clear separation of concerns and strict architectural preservation rules.

## 🎯 Core Features

- **Dual API Support**: REST and GraphQL endpoints
- **JWT Authentication**: Secure token-based authentication
- **Real-time Chat**: Message and chat management
- **Database Abstraction**: In-memory database with interface for future database switching
- **Type Safety**: Full TypeScript implementation with strict mode
- **Layered Architecture**: Controllers, Services, Repositories pattern
- **Seeded Data**: Pre-populated with 10 users and chat history

---

## 🏛️ Core Architecture Principles (MANDATORY)

### Layer Separation Rules

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

### Data Flow Architecture
```
Client Request
    ↓
[Express Middleware]
    ↓
[REST Controller] ←→ [GraphQL Resolver]
    ↓                      ↓
[Service Layer] ←→ [Service Layer]
    ↓                      ↓
[Repository Layer] ←→ [Repository Layer]
    ↓                      ↓
[Database Interface]
    ↓
[Memory Database Implementation]
```

**CRITICAL RULE**: Each layer can ONLY communicate with the layer directly below it.

---

## 📁 Project Structure

```
chat_server/
├── .vscode/                    # VS Code configuration
│   ├── settings.json          # TypeScript and debugging settings
│   └── launch.json            # Debug configuration
├── dist/                      # Compiled JavaScript output
├── node_modules/              # Dependencies
├── src/                       # TypeScript source code
│   ├── config/                # Configuration files
│   │   └── app.config.ts      # Application configuration
│   ├── controllers/           # REST API controllers
│   │   ├── auth.controller.ts # Authentication endpoints
│   │   └── user.controller.ts # User management endpoints
│   ├── database/              # Database layer
│   │   ├── interfaces/        # Database interfaces
│   │   │   └── database.interface.ts
│   │   ├── repositories/      # Repository implementations
│   │   │   ├── chat.repository.ts
│   │   │   ├── chat-member.repository.ts
│   │   │   ├── message.repository.ts
│   │   │   └── user.repository.ts
│   │   ├── database.factory.ts # Database factory pattern
│   │   ├── database.manager.ts # Database connection manager
│   │   ├── memory.database.ts  # In-memory database implementation
│   │   └── seed.ts            # Data seeding utilities
│   ├── graphql/               # GraphQL layer
│   │   ├── inputs/            # GraphQL input types
│   │   ├── middleware/        # GraphQL-specific middleware
│   │   │   └── auth.middleware.ts
│   │   ├── resolvers/         # GraphQL resolvers
│   │   │   ├── ChatResolver.ts
│   │   │   └── UserResolver.ts
│   │   ├── types/             # GraphQL type definitions
│   │   │   ├── Chat.ts
│   │   │   ├── ChatMember.ts
│   │   │   ├── Message.ts
│   │   │   └── User.ts
│   │   ├── context.ts         # GraphQL context creation
│   │   └── server.ts          # Apollo Server configuration
│   ├── middleware/            # Express middleware
│   │   ├── app.middleware.ts  # Application middleware
│   │   ├── auth.middleware.ts # JWT authentication
│   │   └── error-handler.middleware.ts
│   ├── routes/                # REST API routes
│   │   ├── auth.routes.ts     # Authentication routes
│   │   ├── user.routes.ts     # User routes
│   │   └── index.ts           # Route aggregation
│   ├── services/              # Business logic layer
│   │   ├── chat.service.ts    # Chat business logic
│   │   ├── message.service.ts # Message business logic
│   │   ├── service.manager.ts # Service dependency injection
│   │   └── user.service.ts    # User business logic
│   ├── utils/                 # Utility functions
│   │   ├── jwt.util.ts        # JWT token utilities
│   │   └── logger.util.ts     # Logging utilities
│   ├── index.ts               # Application entry point
│   └── types.ts               # TypeScript type definitions
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── nodemon.json              # Nodemon configuration
├── package.json              # Dependencies and scripts
├── README.md                 # Project documentation
└── tsconfig.json             # TypeScript configuration
```

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
  constructor(private serviceManager: ServiceManager) {} // CORRECT!
  
  @Query(() => [Message])
  async getMessages(@Ctx() context: GraphQLContext) {
    const messageService = this.serviceManager.getMessageService();
    return messageService.getMessages(context.user.id); // FOLLOWS ARCHITECTURE
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
  const messageService = this.serviceManager.getMessageService();
  return messageService.sendMessage(input, context.user.id); // CORRECT!
}
```

### ❌ Violation 3: Service Manager Bypass

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

## ✅ Mandatory Implementation Patterns

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
    private chatRepository: ChatRepository
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
    
    // 4. Update cross-entity business logic
    await this.chatRepository.updateLastMessage(input.chatId, message.id);
    
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
}
```

---

## 🏛️ Architecture Layers

### 1. **Presentation Layer**
- **REST Controllers**: Handle HTTP requests and responses
- **GraphQL Resolvers**: Handle GraphQL queries and mutations
- **Middleware**: Authentication, validation, error handling
- **RULE**: No business logic, only request/response handling

### 2. **Business Logic Layer**
- **Services**: Contain business rules and logic
- **Service Manager**: Dependency injection and service orchestration
- **Validation**: Input validation and business rule enforcement
- **RULE**: All business logic must reside here

### 3. **Data Access Layer**
- **Repositories**: Data access patterns and CRUD operations
- **Database Interface**: Abstraction for different database types
- **Database Manager**: Connection management and initialization
- **RULE**: Only data access operations, no business logic

### 4. **Infrastructure Layer**
- **Database Implementation**: Currently in-memory, extensible to PostgreSQL/MongoDB
- **Authentication**: JWT token management
- **Configuration**: Environment-based configuration
- **Logging**: Centralized logging utilities

---

## 🔄 Data Flow Architecture

```
Client Request
    ↓
[Express Middleware]
    ↓
[REST Controller] ←→ [GraphQL Resolver]
    ↓                      ↓
[Service Layer] ←→ [Service Layer]
    ↓                      ↓
[Repository Layer] ←→ [Repository Layer]
    ↓                      ↓
[Database Interface]
    ↓
[Memory Database Implementation]
```

**CRITICAL**: Data must flow through each layer in sequence. No layer bypassing allowed.

---

## 🔧 Service Manager Integration Rules

### Rule 1: Always Use Service Manager for Dependencies

```typescript
// ✅ CORRECT: Service manager integration
export class ServiceManager {
  private userService: UserService;
  private chatService: ChatService;
  private messageService: MessageService;
  
  constructor(private databaseManager: DatabaseManager) {
    this.initializeServices();
  }
  
  private initializeServices(): void {
    const database = this.databaseManager.getDatabase();
    
    // Initialize repositories
    const userRepository = new UserRepository(database);
    const chatRepository = new ChatRepository(database);
    const messageRepository = new MessageRepository(database);
    
    // Initialize services with dependencies
    this.userService = new UserService(userRepository);
    this.chatService = new ChatService(chatRepository, chatMemberRepository);
    this.messageService = new MessageService(messageRepository, chatRepository);
  }
  
  // Getters for services
  getUserService(): UserService { return this.userService; }
  getChatService(): ChatService { return this.chatService; }
  getMessageService(): MessageService { return this.messageService; }
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

## 🛡️ Security Architecture

### Authentication Flow
1. **User Registration/Login**: Credentials validated, JWT token issued
2. **Token Verification**: Middleware validates JWT on protected routes
3. **Context Creation**: GraphQL context includes authenticated user
4. **Authorization**: Role-based access control in resolvers and controllers

### Authentication Integration Rules

#### Rule 1: Always Use Existing Auth Context

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

### Security Features
- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Tokens**: Secure token-based authentication
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Input Validation**: Request validation middleware
- **Error Handling**: Secure error responses without sensitive data

---

## 💾 Database Architecture

### Current Implementation: In-Memory Database
```typescript
interface DatabaseInterface {
  // User operations
  createUser(user: UserEntity): Promise<UserEntity>
  findUserById(id: number): Promise<UserEntity | null>
  findUserByUsername(username: string): Promise<UserEntity | null>
  
  // Chat operations
  createChat(chat: ChatEntity): Promise<ChatEntity>
  findChatById(id: string): Promise<ChatEntity | null>
  findChatsByMemberId(userId: string): Promise<ChatEntity[]>
  
  // Message operations
  createMessage(message: MessageEntity): Promise<MessageEntity>
  findMessagesByChatId(chatId: string): Promise<MessageEntity[]>
  
  // Chat member operations
  createChatMember(member: ChatMemberEntity): Promise<ChatMemberEntity>
  findChatMembersByChatId(chatId: string): Promise<ChatMemberEntity[]>
}
```

### Database Interface Extension Rules

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

### Database Abstraction Benefits
- **Future Migration**: Easy switch to PostgreSQL, MongoDB, or MySQL
- **Testing**: Simple mocking and testing with in-memory implementation
- **Development**: No external database dependencies
- **Consistency**: Uniform interface across different database types

---

## 📊 Data Models

### Core Entities
```typescript
// User entity (numeric IDs)
interface User {
  id: number
  username: string
  password: string  // bcrypt hashed
  createdAt: Date
}

// Chat entity (string IDs)
interface Chat {
  id: string
  name: string
  creatorId: string
  memberIds: string[]
  isGroup: boolean
  lastMessageId?: string
  createdAt: Date
  updatedAt: Date
}

// Message entity (string IDs)
interface Message {
  id: string
  chatId: string
  userId: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  replyToId?: string
  createdAt: Date
  updatedAt?: Date
}

// Chat member relationship
interface ChatMember {
  id: string
  chatId: string
  userId: string
  role: 'admin' | 'member'
  joinedAt: Date
  isActive: boolean
}
```

### Type Definition Rules

#### Rule 1: Extend Existing Types File

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

#### Rule 2: GraphQL Type Definitions

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

### Seeded Data
- **10 Users**: alice, bob, charlie, diana, eve, frank, grace, henry, iris, jack
- **8 Chats**: 3 group chats + 5 direct chats
- **40-120 Messages**: Realistic conversation history with timestamps

---

## 🔧 Technology Stack

### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Language**: TypeScript (strict mode)
- **GraphQL**: Apollo Server v4 + Type-GraphQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Development**: ts-node, nodemon

### Dependencies
```json
{
  "dependencies": {
    "@apollo/server": "^4.12.2",
    "@as-integrations/express5": "^1.1.0",
    "bcryptjs": "^2.4.3",
    "class-validator": "^0.14.2",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "graphql": "^16.11.0",
    "jsonwebtoken": "^9.0.2",
    "reflect-metadata": "^0.2.2",
    "type-graphql": "^2.0.0-rc.2"
  }
}
```

---

## 🏃‍♂️ Development Workflow

### Build Process
1. **TypeScript Compilation**: Source files compiled from `src/` to `dist/`
2. **Type Checking**: Strict TypeScript mode with comprehensive type safety
3. **Development Mode**: Hot reload with `ts-node` and `nodemon`
4. **Production Build**: Optimized JavaScript output

### Development Commands
```bash
npm run dev          # Development with hot reload
npm run build        # Production build
npm start           # Run production build
npm test            # Run tests (placeholder)
```

### Environment Configuration
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
CORS_ORIGIN=*
DATABASE_TYPE=memory
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

## 🚀 Deployment Architecture

### Current Status
- **Development Ready**: Full local development environment
- **Production Build**: TypeScript compilation to optimized JavaScript
- **Environment Variables**: Configurable for different environments
- **Database Ready**: Abstraction layer ready for production database

### Future Deployment Considerations
- **Database Migration**: Switch from in-memory to PostgreSQL/MongoDB
- **Containerization**: Docker configuration for consistent deployment
- **Environment Separation**: Development, staging, production configurations
- **Monitoring**: Logging and health check endpoints ready
- **Scaling**: Service layer architecture supports horizontal scaling

---

## 🎯 Architecture Benefits

### Maintainability
- **Separation of Concerns**: Clear layer boundaries
- **Dependency Injection**: Loose coupling between components
- **Type Safety**: Comprehensive TypeScript coverage
- **Consistent Patterns**: Uniform code structure across modules

### Scalability
- **Database Abstraction**: Easy database switching
- **Service Layer**: Business logic isolation
- **Repository Pattern**: Data access optimization
- **Stateless Design**: Horizontal scaling ready

### Developer Experience
- **Hot Reload**: Fast development cycle
- **Type Safety**: Compile-time error catching
- **VS Code Integration**: Debugging and IntelliSense
- **Clear Structure**: Easy navigation and understanding

### Testing Ready
- **Layer Isolation**: Easy unit testing
- **Dependency Injection**: Simple mocking
- **Interface Contracts**: Clear testing boundaries
- **In-Memory Database**: Fast test execution

---

## 🔮 Future Enhancements

### Planned Features
- **Real-time Subscriptions**: WebSocket integration for live messaging
- **File Uploads**: Image and file sharing capabilities
- **Message Reactions**: Emoji reactions and message status
- **Push Notifications**: Real-time notification system
- **Advanced Chat Features**: Message editing, deletion, threading

### Technical Improvements
- **Database Migration**: Production database implementation
- **Caching Layer**: Redis for performance optimization
- **Rate Limiting**: API protection and abuse prevention
- **Comprehensive Testing**: Unit, integration, and e2e tests
- **API Documentation**: Automated documentation generation

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

This comprehensive architecture provides a solid foundation for a modern chat application with room for growth and enhancement while maintaining clean, maintainable code structure and strict architectural discipline.