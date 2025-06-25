# Express Chat Backend Server

A simple chat backend server built with Express.js featuring JWT authentication.

## Features

- User registration and login with JWT tokens
- Password hashing with bcrypt
- Input validation
- Protected routes
- CORS enabled
- Health check endpoint

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

3. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/health` - Check if server is running

### Authentication
- **POST** `/auth/register` - Register a new user
  - Body: `{ "username": "string", "password": "string" }`
  - Username must be at least 3 characters
  - Password must be at least 6 characters

- **POST** `/auth/login` - Login user
  - Body: `{ "username": "string", "password": "string" }`

- **GET** `/auth/profile` - Get user profile (requires authentication)
  - Headers: `Authorization: Bearer <token>`

### Users
- **GET** `/users` - Get all users (requires authentication)
  - Headers: `Authorization: Bearer <token>`

## Authentication

The server uses JWT (JSON Web Tokens) for authentication. After successful login or registration, you'll receive a token that should be included in the Authorization header for protected routes:

```
Authorization: Bearer <your-jwt-token>
```

## Example Usage

### Register a new user:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123"}'
```

### Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123"}'
```

### Access protected route:
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Security Notes

- In production, replace the in-memory user storage with a proper database
- Use a strong, unique JWT_SECRET
- Consider adding rate limiting
- Implement proper error handling
- Add HTTPS in production 