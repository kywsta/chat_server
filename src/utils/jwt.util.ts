import jwt from 'jsonwebtoken';
import { appConfig } from '../config/app.config';
import { JWTPayload } from '../types';
import { LoggerUtil } from './logger.util';

export class JWTUtil {
  static generateToken(payload: JWTPayload): string {
    try {
      const token = jwt.sign(payload, appConfig.jwtSecret, {
        expiresIn: '24h' // Default to 24 hours
      });
      LoggerUtil.debug('JWT token generated successfully', { userId: payload.userId });
      return token;
    } catch (error) {
      LoggerUtil.error('Failed to generate JWT token', error);
      throw error;
    }
  }

  static verifyToken(token: string): Promise<JWTPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, appConfig.jwtSecret, (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) {
          LoggerUtil.warn('JWT token verification failed', err.message);
          reject(err);
        } else {
          LoggerUtil.debug('JWT token verified successfully', { userId: decoded.userId });
          resolve(decoded as JWTPayload);
        }
      });
    });
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1] || null;
  }
} 