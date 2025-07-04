# Cursor IDE Agent Instructions - Chat Server Development

## 🤖 Agent Context Setup

**Project**: Express.js + TypeScript chat server with GraphQL API and real-time messaging
**Current Status**: JWT authentication with layered architecture (controllers, services, repositories)
**Database**: In-memory with abstraction layer for future database switching
**Goal**: Build GraphQL chat feature integrating with existing auth system

## 📦 Phase 1: GraphQL Foundation

### Task 1.1: Install Dependencies
```bash
# You've already installed these - perfect!
npm install @apollo/server graphql express@5 @as-integrations/express5 cors
npm install type-graphql reflect-metadata class-validator
npm install @types/node ts-node typescript -D
```

### Task 1.2: Apollo Server Setup
Create `src/graphql/server.ts` with Apollo Server v4 configuration:
- Use standalone Apollo Server with Express middleware
- Enable TypeScript decorators in `tsconfig.json`
- Set up basic GraphQL schema with Type-GraphQL
- Configure CORS for development
- Add JWT authentication context

### Task 1.3: GraphQL Schema Types
Create these TypeScript classes in `src/graphql/types/`:
- `User.ts` - Extend existing auth user
- `Chat.ts` - Chat room/conversation
- `Message.ts` - Individual message
- `ChatMember.ts` - User participation in chat
- Use Type-GraphQL decorators (`@ObjectType`, `@Field`, `@ID`)

### Task 1.4: GraphQL Authentication Integration
Create `src/graphql/middleware/auth.middleware.ts`:
- Integrate with existing `src/middleware/auth.middleware.ts`
- Use existing `src/utils/jwt.util.ts` for token validation
- Create GraphQL context with authenticated user
- Handle unauthorized GraphQL requests

## 🔄 Phase 2: Core Operations

### Task 2.1: Database Layer Extension
Following existing architecture pattern:
- Create `src/database/repositories/chat.repository.ts`
- Create `src/database/repositories/message.repository.ts`
- Extend `src/database/interfaces/database.interface.ts` with chat/message methods
- Update `src/database/memory.database.ts` to implement new interfaces
- Follow same patterns as existing `user.repository.ts`

### Task 2.2: Service Layer
Create following existing service pattern:
- `src/services/chat.service.ts` - Business logic for chats
- `src/services/message.service.ts` - Business logic for messages
- Update `src/services/service.manager.ts` to include new services
- Follow same dependency injection pattern as `user.service.ts`

### Task 2.3: Input Types
Create input types in `src/graphql/inputs/`:
- `CreateChatInput.ts`
- `SendMessageInput.ts`
- `AddMemberInput.ts`
- Use `@InputType` and `@ArgsType` decorators

### Task 2.4: Query Resolvers
Create `src/graphql/resolvers/ChatResolver.ts`:
```typescript
@Resolver()
export class ChatResolver {
  constructor(
    private chatService: ChatService,
    private messageService: MessageService
  ) {}

  @Query(() => [Chat])
  async getUserChats(@Ctx() context: GraphQLContext): Promise<Chat[]> {
    // Use context.user from auth middleware
    return this.chatService.getUserChats(context.user.id);
  }
  
  @Query(() => [Message])
  async getChatMessages(
    @Arg("chatId") chatId: string,
    @Arg("limit", { defaultValue: 50 }) limit: number,
    @Arg("offset", { defaultValue: 0 }) offset: number,
    @Ctx() context: GraphQLContext
  ): Promise<Message[]> {
    return this.messageService.getChatMessages(chatId, limit, offset);
  }
}
```

### Task 2.5: Mutation Resolvers
Add mutations to same resolver:
- `createChat` - Use chatService.createChat()
- `sendMessage` - Use messageService.sendMessage()
- `addChatMember` - Use chatService.addMember()
- Follow existing service injection pattern
- Use existing error handling from `src/middleware/error-handler.middleware.ts`

### Task 2.6: Authentication Context
Create `src/graphql/context.ts`:
- Integrate with existing `src/middleware/auth.middleware.ts`
- Use existing `src/utils/jwt.util.ts` for token validation
- Create GraphQL context with authenticated user
- Handle unauthorized GraphQL requests

## ⚡ Phase 3: Real-time Features

### Task 3.1: Subscription Dependencies
```bash
npm install graphql-subscriptions graphql-ws ws
npm install @types/ws -D
```

### Task 3.2: WebSocket Server Setup
Update `src/graphql/server.ts`:
- Add WebSocket server using `graphql-ws`
- Configure subscription handling with Apollo Server v4
- Set up PubSub (use in-memory for development)
- Handle WebSocket authentication

### Task 3.3: Subscription Resolvers
Add to `ChatResolver.ts`:
```typescript
@Subscription(() => Message, {
  topics: ({ args }) => `MESSAGE_ADDED_${args.chatId}`
})
async messageAdded(@Arg("chatId") chatId: string): Promise<Message>

@Subscription(() => Boolean, {
  topics: ({ args }) => `TYPING_${args.chatId}`
})
async typingIndicator(@Arg("chatId") chatId: string): Promise<boolean>
```

### Task 3.4: PubSub Integration
- Trigger subscriptions in mutation resolvers
- Use `pubSub.publish()` when messages are sent
- Handle subscription cleanup on disconnect

## 🚀 Phase 4: Advanced Features

### Task 4.1: Message Types
Extend Message model to support:
- Text messages
- Image/file attachments
- System messages (user joined/left)
- Message status (sent/delivered/read)

### Task 4.2: Chat Management
Add mutations for:
- Edit/delete messages
- Create group chats
- Leave/archive chats
- Mute notifications
- Admin permissions

### Task 4.3: Performance Optimization
- Add DataLoader for N+1 query prevention
- Implement query complexity analysis
- Add rate limiting middleware
- Optimize database queries

## 🧪 Phase 5: Testing Setup

### Task 5.1: Test Environment
```bash
npm install jest @types/jest supertest -D
npm install apollo-server-testing graphql-query-test-tool -D
```

### Task 5.2: Test Structure
Create tests in `src/__tests__/`:
- `auth.test.ts` - Authentication flows
- `chat.test.ts` - Chat operations
- `message.test.ts` - Message CRUD
- `subscription.test.ts` - Real-time features

### Task 5.3: Mock Data
Create test fixtures with:
- Sample users
- Chat conversations
- Message history
- Use factories for consistent test data

## 🔧 Development Guidelines for Agent

### Code Style
- Use TypeScript strict mode
- Follow existing project conventions
- Use async/await over promises
- Add JSDoc comments for complex functions
- Use descriptive variable names

### Error Handling
- Use custom GraphQL error types
- Log errors appropriately
- Return user-friendly error messages
- Handle database connection issues

### Security Considerations
- Validate all inputs
- Sanitize user content
- Check user permissions for chat access
- Rate limit mutations and subscriptions

### File Structure
```
src/
├── config/
├── controllers/          # REST controllers
├── database/             # Infrastructure: connection, factory, manager, memory db
│   ├── interfaces/       # Database interfaces
│   ├── memory_database/  # In-memory DB logic, filter utils
│   │   ├── memory.database.ts
│   │   ├── filter.util.ts
│   │   └── query-builder.util.ts
│   ├── database.factory.ts
│   ├── database.manager.ts
│   └── seed.ts
├── data/                 # Data layer: repository implementations
│   └── repositories/
│       ├── MemoryUserRepository.ts
│       ├── MemoryChatRepository.ts
│       ├── MemoryMessageRepository.ts
│       └── MemoryChatMemberRepository.ts
├── domain/               # Domain layer: entities and repository interfaces
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   ├── Message.ts
│   │   ├── ChatMember.ts
│   │   └── data-entity.ts
│   └── repositories/
│       ├── IUserRepository.ts
│       ├── IChatRepository.ts
│       ├── IMessageRepository.ts
│       ├── IChatMemberRepository.ts
│       └── base/
│           └── Repository.ts
├── graphql/              # GraphQL layer
│   ├── server.ts
│   ├── context.ts
│   ├── types/
│   ├── inputs/
│   ├── resolvers/
│   └── middleware/
├── middleware/           # Middleware (auth, error handling, etc.)
├── routes/               # REST routes
├── services/             # Service layer (chat, message, etc.)
├── utils/                # Utilities (logger, jwt, etc.)
└── __tests__/            # Tests
```

## 🎯 Success Criteria

Each phase should result in:
1. **Phase 1**: GraphQL endpoint responding with basic schema
2. **Phase 2**: Full CRUD operations for chats and messages
3. **Phase 3**: Real-time messaging working in GraphQL playground
4. **Phase 4**: Advanced features complete and tested
5. **Phase 5**: Comprehensive test coverage and documentation

## 🚨 Common Pitfalls to Avoid

- Don't use deprecated `apollo-server-express`
- Remember to enable experimental decorators in TypeScript
- Handle WebSocket authentication properly
- Don't forget to publish subscription events in mutations
- Ensure proper error handling in resolvers

## 📝 Agent Prompts for Each Task

When starting each task, provide the agent with:
1. Current phase and task number
2. Specific files to create/modify
3. Dependencies that should be already installed
4. Expected output/behavior
5. Any existing code that needs integration

Example prompt:
> "I'm working on Task 2.2 - Query Resolvers. I need you to create a ChatResolver class in src/graphql/resolvers/ChatResolver.ts that implements getUserChats and getChatMessages queries. The JWT auth context should already be available. Use the Chat and Message types we defined earlier."