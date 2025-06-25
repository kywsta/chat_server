import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';

export class UserController {
  static getAllUsers(req: Request, res: Response): void {
    const users = UserModel.getAllUsers();
    res.json(users);
  }
} 