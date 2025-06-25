import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserModel } from '../models/user.model';
import { AuthenticatedRequest, LoginRequest, RegisterRequest } from '../types';
import { JWTUtil } from '../utils/jwt.util';
import { LoggerUtil } from '../utils/logger.util';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password } = req.body as RegisterRequest;

      // Check if user already exists
      if (UserModel.userExists(username)) {
        res.status(400).json({ message: 'Username already exists' });
        return;
      }

      // Create new user
      const newUser = await UserModel.create(username, password);

      // Generate JWT token
      const token = JWTUtil.generateToken({
        userId: newUser.id,
        username: newUser.username
      });

      LoggerUtil.info('User registered successfully', { username, userId: newUser.id });

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: UserModel.toUserResponse(newUser)
      });

    } catch (error) {
      LoggerUtil.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password } = req.body as LoginRequest;

      // Find user
      const user = UserModel.findByUsername(username);
      if (!user) {
        LoggerUtil.warn('Login attempt with invalid username', { username });
        res.status(401).json({ message: 'Invalid username or password' });
        return;
      }

      // Check password
      const isValidPassword = await UserModel.validatePassword(password, user.password);
      if (!isValidPassword) {
        LoggerUtil.warn('Login attempt with invalid password', { username });
        res.status(401).json({ message: 'Invalid username or password' });
        return;
      }

      // Generate JWT token
      const token = JWTUtil.generateToken({
        userId: user.id,
        username: user.username
      });

      LoggerUtil.info('User logged in successfully', { username, userId: user.id });

      res.json({
        message: 'Login successful',
        token,
        user: UserModel.toUserResponse(user)
      });

    } catch (error) {
      LoggerUtil.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static getProfile(req: Request, res: Response): void {
    const authenticatedReq = req as AuthenticatedRequest;
    const user = UserModel.findById(authenticatedReq.user?.userId!);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(UserModel.toUserResponse(user));
  }
} 