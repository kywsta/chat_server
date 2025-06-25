import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { JWTUtil } from '../utils/jwt.util';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = JWTUtil.extractTokenFromHeader(req.headers['authorization']);

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const decoded = await JWTUtil.verifyToken(token);
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}; 