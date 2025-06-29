# Express.js TypeScript Chat Server - API Documentation

## 🔌 API Overview

This chat server provides both REST and GraphQL APIs for comprehensive client integration. The APIs support user authentication, chat management, and real-time messaging capabilities.

---

## 🔐 Authentication

All protected endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Flow
1. **Register/Login** → Receive JWT token
2. **Include token** in subsequent requests
3. **Token validation** happens automatically via middleware

---

## 🌐 REST API Endpoints

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### POST `/auth/register`
Create a new user account.

**Request Body:**
```json
{
  "username": "alice",
  "password": "password123",
  "email": "alice@example.com" // optional
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Validation error (missing fields, invalid format)
- `409` - Username or email already exists

---

#### POST `/auth/login`
Authenticate existing user.

**Request Body:**
```json
{
  "username": "alice",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Validation error (missing fields)
- `401` - Invalid credentials
- `403` - Account deactivated

---

#### GET `/auth/profile` 🔒
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com"
}
```

**Error Responses:**
- `401` - Invalid or missing token
- `404` - User not found

---

### User Management Endpoints

#### GET `/users` 🔒
List all users (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of users to return (default: 50)
- `offset` (optional): Number of users to skip (default: 0)

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  },
  {
    "id": 2,
    "username": "bob"
  }
]
```

---

#### GET `/users/id/:id` 🔒
Get specific user by ID (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com"
}
```

**Error Responses:**
- `404` - User not found

---

#### GET `/users/username/:username` 🔒
Get specific user by username (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com"
}
```

**Error Responses:**
- `404` - User not found

---

#### GET `/users/stats` 🔒
Get user statistics (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "totalUsers": 10,
  "activeUsers": 10,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### PUT `/users/password` 🔒
Update user password (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `400` - Invalid password format
- `401` - Invalid or missing token

---

### Health & Status Endpoints

#### GET `/health`
Server health check (no authentication required).

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "database": {
    "status": "healthy",
    "connection": true,
    "details": {
      "collections": 4,
      "totalRecords": 126,
      "uptime": 8135
    }
  }
}
```

---

#### GET `/db/status`
Database status check (no authentication required).

**Response (200):**
```json
{
  "database": {
    "type": "memory",
    "status": "healthy",
    "connection": true,
    "details": {
      "collections": 4,
      "totalRecords": 126,
      "uptime": 8135
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🚀 GraphQL API

### Endpoint
```
http://localhost:3000/graphql
```

### GraphQL Playground
Available at: `http://localhost:3000/graphql` (development only)

### Authentication
Include JWT token in request headers:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

---

## 📋 GraphQL Schema

### Types

#### User Type
```graphql
type User {
  id: ID!
  username: String!
  email: String
  isActive: Boolean!
  createdAt: DateTime!
}
```

#### Chat Type
```graphql
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
```

#### Message Type
```graphql
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
```

#### ChatMember Type
```graphql
type ChatMember {
  id: ID!
  chatId: String!
  userId: String!
  role: ChatMemberRole!
  joinedAt: DateTime!
  isActive: Boolean!
}
```

### Enums

#### MessageType
```graphql
enum MessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM
}
```

#### ChatMemberRole
```graphql
enum ChatMemberRole {
  ADMIN
  MEMBER
}
```

---

## 🔍 GraphQL Queries

### User Queries

#### `hello`
Basic connectivity test.

```graphql
query {
  hello
}
```

**Response:**
```json
{
  "data": {
    "hello": "Hello from GraphQL!"
  }
}
```

---

#### `me` 🔒
Get current authenticated user.

```graphql
query {
  me {
    id
    username
    email
    isActive
    createdAt
  }
}
```

**Response:**
```json
{
  "data": {
    "me": {
      "id": "1",
      "username": "alice",
      "email": "alice@example.com",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### Chat Queries

#### `getUserChats` 🔒
Get all chats for authenticated user.

```graphql
query {
  getUserChats {
    id
    name
    creatorId
    memberIds
    isGroup
    lastMessageId
    createdAt
    updatedAt
  }
}
```

**Response:**
```json
{
  "data": {
    "getUserChats": [
      {
        "id": "chat_1",
        "name": "General Discussion",
        "creatorId": "1",
        "memberIds": ["1", "2", "3"],
        "isGroup": true,
        "lastMessageId": "msg_42",
        "createdAt": "2024-01-15T09:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

#### `getChat` 🔒
Get specific chat by ID.

```graphql
query GetChat($chatId: String!) {
  getChat(chatId: $chatId) {
    id
    name
    creatorId
    memberIds
    isGroup
    lastMessageId
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "chatId": "chat_1"
}
```

---

#### `getChatMessages` 🔒
Get messages for a specific chat.

```graphql
query GetChatMessages($chatId: String!, $limit: Int, $offset: Int) {
  getChatMessages(chatId: $chatId, limit: $limit, offset: $offset) {
    id
    chatId
    userId
    content
    type
    replyToId
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "chatId": "chat_1",
  "limit": 20,
  "offset": 0
}
```

**Response:**
```json
{
  "data": {
    "getChatMessages": [
      {
        "id": "msg_42",
        "chatId": "chat_1",
        "userId": "2",
        "content": "Hello everyone!",
        "type": "TEXT",
        "replyToId": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": null
      }
    ]
  }
}
```

---

#### `getChatMembers` 🔒
Get members of a specific chat.

```graphql
query GetChatMembers($chatId: String!) {
  getChatMembers(chatId: $chatId) {
    id
    chatId
    userId
    role
    joinedAt
    isActive
  }
}
```

**Variables:**
```json
{
  "chatId": "chat_1"
}
```

---

## ✏️ GraphQL Mutations

### Chat Mutations

#### `createChat` 🔒
Create a new chat.

```graphql
mutation CreateChat($input: CreateChatInput!) {
  createChat(input: $input) {
    id
    name
    creatorId
    memberIds
    isGroup
    createdAt
  }
}
```

**Input Type:**
```graphql
input CreateChatInput {
  name: String!
  memberIds: [String!]!
  isGroup: Boolean = true
}
```

**Variables:**
```json
{
  "input": {
    "name": "Project Team",
    "memberIds": ["2", "3", "4"],
    "isGroup": true
  }
}
```

---

#### `sendMessage` 🔒
Send a message to a chat.

```graphql
mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) {
    id
    chatId
    userId
    content
    type
    createdAt
  }
}
```

**Input Type:**
```graphql
input SendMessageInput {
  chatId: String!
  content: String!
  type: MessageType = TEXT
  replyToId: String
}
```

**Variables:**
```json
{
  "input": {
    "chatId": "chat_1",
    "content": "Hello from GraphQL!",
    "type": "TEXT"
  }
}
```

---

#### `addChatMember` 🔒
Add a member to a chat.

```graphql
mutation AddChatMember($input: AddMemberInput!) {
  addChatMember(input: $input) {
    id
    chatId
    userId
    role
    joinedAt
    isActive
  }
}
```

**Input Type:**
```graphql
input AddMemberInput {
  chatId: String!
  userId: String!
  role: ChatMemberRole = MEMBER
}
```

**Variables:**
```json
{
  "input": {
    "chatId": "chat_1",
    "userId": "5",
    "role": "MEMBER"
  }
}
```

---

## 🔄 GraphQL Subscriptions

### Real-time Message Updates

#### `messageAdded` 🔒
Subscribe to new messages in a specific chat.

```graphql
subscription MessageAdded($chatId: String!) {
  messageAdded(chatId: $chatId) {
    id
    chatId
    userId
    content
    type
    createdAt
  }
}
```

**Variables:**
```json
{
  "chatId": "chat_1"
}
```

**WebSocket Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

---

#### `typingIndicator` 🔒
Subscribe to typing indicators in a chat.

```graphql
subscription TypingIndicator($chatId: String!) {
  typingIndicator(chatId: $chatId) {
    chatId
    userId
    isTyping
  }
}
```

---

## 🚨 Error Handling

### REST API Errors

**Standard Error Response:**
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

### GraphQL Errors

**Error Response Format:**
```json
{
  "errors": [
    {
      "message": "Error description",
      "locations": [{"line": 2, "column": 3}],
      "path": ["fieldName"],
      "extensions": {
        "code": "ERROR_CODE",
        "details": {}
      }
    }
  ],
  "data": null
}
```

**Common GraphQL Error Codes:**
- `UNAUTHENTICATED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `BAD_USER_INPUT` - Invalid input data
- `INTERNAL_ERROR` - Server error

---

## 📊 Rate Limiting

### REST API
- **Rate Limit**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when rate limit resets

### GraphQL API
- **Query Complexity**: Maximum complexity score of 1000
- **Query Depth**: Maximum nesting depth of 10
- **Rate Limit**: 50 operations per minute per authenticated user

---

## 🧪 Testing Examples

### cURL Examples

**Register User:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <jwt_token>"
```

**Get Users:**
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer <jwt_token>"
```

**Get User by ID:**
```bash
curl -X GET http://localhost:3000/users/id/1 \
  -H "Authorization: Bearer <jwt_token>"
```

**Health Check:**
```bash
curl -X GET http://localhost:3000/health
```

### GraphQL Examples

**Using curl:**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"query":"query { me { id username } }"}'
```

**Using GraphQL Playground:**
1. Navigate to `http://localhost:3000/graphql`
2. Add authentication header in HTTP Headers panel:
   ```json
   {
     "Authorization": "Bearer <jwt_token>"
   }
   ```
3. Execute queries and mutations

---

## 📈 Performance Considerations

### REST API
- **Pagination**: Use `limit` and `offset` parameters for large datasets
- **Caching**: ETags and conditional requests supported
- **Compression**: Gzip compression enabled

### GraphQL API
- **Query Optimization**: Use DataLoader to prevent N+1 queries
- **Query Complexity Analysis**: Prevents expensive queries
- **Subscription Cleanup**: Automatic cleanup on client disconnect
- **Batching**: Multiple operations in single request supported

---

## 🔧 Development Tools

### GraphQL Playground
- **URL**: `http://localhost:3000/graphql` (development only)
- **Features**: Query autocompletion, schema exploration, subscription testing

### REST Client Collections
- **Postman Collection**: Available for import
- **Insomnia Collection**: Available for import

### WebSocket Testing
- **Tool**: GraphQL Playground for subscription testing
- **Protocol**: `graphql-ws` for WebSocket subprotocol

This API documentation provides comprehensive coverage of all available endpoints and their usage patterns for both REST and GraphQL interfaces. 