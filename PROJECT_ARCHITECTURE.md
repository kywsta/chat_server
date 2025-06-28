# Express.js TypeScript Chat Server - Project Architecture

## 🏗️ Overview

This is a modern Express.js chat server built with TypeScript, featuring both REST and GraphQL APIs, JWT authentication, and a layered architecture designed for scalability and maintainability. The project follows clean architecture principles with clear separation of concerns.

## 🎯 Core Features

- **Dual API Support**: REST and GraphQL endpoints
- **JWT Authentication**: Secure token-based authentication
- **Real-time Chat**: Message and chat management
- **Database Abstraction**: In-memory database with interface for future database switching
- **Type Safety**: Full TypeScript implementation with strict mode
- **Layered Architecture**: Controllers, Services, Repositories pattern
- **Seeded Data**: Pre-populated with 10 users and chat history

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

## 🏛️ Architecture Layers

### 1. **Presentation Layer**
- **REST Controllers**: Handle HTTP requests and responses
- **GraphQL Resolvers**: Handle GraphQL queries and mutations
- **Middleware**: Authentication, validation, error handling

### 2. **Business Logic Layer**
- **Services**: Contain business rules and logic
- **Service Manager**: Dependency injection and service orchestration
- **Validation**: Input validation and business rule enforcement

### 3. **Data Access Layer**
- **Repositories**: Data access patterns and CRUD operations
- **Database Interface**: Abstraction for different database types
- **Database Manager**: Connection management and initialization

### 4. **Infrastructure Layer**
- **Database Implementation**: Currently in-memory, extensible to PostgreSQL/MongoDB
- **Authentication**: JWT token management
- **Configuration**: Environment-based configuration
- **Logging**: Centralized logging utilities

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

## 🛡️ Security Architecture

### Authentication Flow
1. **User Registration/Login**: Credentials validated, JWT token issued
2. **Token Verification**: Middleware validates JWT on protected routes
3. **Context Creation**: GraphQL context includes authenticated user
4. **Authorization**: Role-based access control in resolvers and controllers

### Security Features
- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Tokens**: Secure token-based authentication
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Input Validation**: Request validation middleware
- **Error Handling**: Secure error responses without sensitive data

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

### Database Abstraction Benefits
- **Future Migration**: Easy switch to PostgreSQL, MongoDB, or MySQL
- **Testing**: Simple mocking and testing with in-memory implementation
- **Development**: No external database dependencies
- **Consistency**: Uniform interface across different database types

## 🔌 API Architecture

### REST API Endpoints
```
Authentication:
  POST /api/auth/register    # User registration
  POST /api/auth/login       # User login
  GET  /api/auth/profile     # Get user profile (protected)

Users:
  GET  /api/users           # List users (protected)
  GET  /api/users/:id       # Get user by ID (protected)

Health:
  GET  /health              # Health check
```

### GraphQL API Schema
```graphql
type Query {
  # User queries
  hello: String!
  me: User
  
  # Chat queries
  getUserChats: [Chat!]!
  getChat(chatId: String!): Chat
  getChatMessages(chatId: String!, limit: Int, offset: Int): [Message!]!
  getChatMembers(chatId: String!): [ChatMember!]!
}

type User {
  id: ID!
  username: String!
  isActive: Boolean!
}

type Chat {
  id: ID!
  name: String!
  creatorId: String!
  memberIds: [String!]!
  isGroup: Boolean!
  lastMessageId: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Message {
  id: ID!
  chatId: String!
  userId: String!
  content: String!
  type: MessageType!
  replyToId: String
  createdAt: DateTime!
  updatedAt: DateTime
}

type ChatMember {
  id: ID!
  chatId: String!
  userId: String!
  role: ChatMemberRole!
  joinedAt: DateTime!
  isActive: Boolean!
}

enum MessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM
}

enum ChatMemberRole {
  ADMIN
  MEMBER
}
```

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

### Seeded Data
- **10 Users**: alice, bob, charlie, diana, eve, frank, grace, henry, iris, jack
- **8 Chats**: 3 group chats + 5 direct chats
- **40-120 Messages**: Realistic conversation history with timestamps

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

This architecture provides a solid foundation for a modern chat application with room for growth and enhancement while maintaining clean, maintainable code structure. 