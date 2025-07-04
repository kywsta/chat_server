import { Request, Response } from 'express';
import { ServiceManager } from '../services/service.manager';
import { AuthenticatedRequest } from '../types';
import { LoggerUtil } from '../utils/logger.util';

export class UserController {
  private static getUserService() {
    return ServiceManager.getInstance().getUserService();
  }

  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserController.getUserService().getAllUsers();
      res.json(users);
    } catch (error) {
      LoggerUtil.error('Failed to get all users', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID parameter is required' });
        return;
      }
    
      const user = await UserController.getUserService().getUserById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      LoggerUtil.error('Failed to get user by ID', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserByUsername(req: Request, res: Response): Promise<void> {
    try {
      const username = req.params.username;
      
      if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
      }

      const user = await UserController.getUserService().getUserByUsername(username);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      LoggerUtil.error('Failed to get user by username', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { newPassword } = req.body;
      
      if (!newPassword) {
        res.status(400).json({ error: 'New password is required' });
        return;
      }

      await UserController.getUserService().updateUserPassword(req.user.userId, newPassword);
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      LoggerUtil.error('Failed to update password', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const totalUsers = await UserController.getUserService().getUserCount();
      
      res.json({
        totalUsers,
        timestamp: new Date()
      });
    } catch (error) {
      LoggerUtil.error('Failed to get user stats', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 