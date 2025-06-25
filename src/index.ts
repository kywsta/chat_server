import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult, ValidationChain } from 'express-validator';
import dotenv from 'dotenv';
import { User, UserResponse, RegisterRequest, LoginRequest, AuthResponse, JWTPayload, AuthenticatedRequest } from './types';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory user storage (replace with database in production)
const users: User[] = [];

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: any) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }
    (req as AuthenticatedRequest).user = decoded as JWTPayload;
    next();
  });
};

// Validation middleware
const validateRegistration: ValidationChain[] = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const validateLogin: ValidationChain[] = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes

// Health check
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'OK', message: 'Chat server is running' });
});

// Register new user
app.post('/auth/register', validateRegistration, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, password } = req.body as RegisterRequest;

    // Check if user already exists
    const existingUser = users.find((user: User) => user.username === username);
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword: string = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: User = {
      id: users.length + 1,
      username,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(newUser);

    // Generate JWT token
    const token: string = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user
app.post('/auth/login', validateLogin, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, password } = req.body as LoginRequest;

    // Find user
    const user = users.find((u: User) => u.username === username);
    if (!user) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    // Check password
    const isValidPassword: boolean = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    // Generate JWT token
    const token: string = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Protected route example
app.get('/auth/profile', authenticateToken, (req: Request, res: Response): void => {
  const authenticatedReq = req as AuthenticatedRequest;
  const user = users.find((u: User) => u.id === authenticatedReq.user?.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  });
});

// Get all users (for chat functionality)
app.get('/users', authenticateToken, (req: Request, res: Response): void => {
  const userList: UserResponse[] = users.map((user: User) => ({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  }));
  
  res.json(userList);
});

// Start server
app.listen(PORT, (): void => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 