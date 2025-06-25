import jwt from 'jsonwebtoken';
import { appConfig } from '../config/app.config';
import { JWTPayload } from '../types';

export class JWTUtil {
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, appConfig.jwtSecret, {
      expiresIn: appConfig.jwtExpiresIn
    });
  }

  static verifyToken(token: string): Promise<JWTPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, appConfig.jwtSecret, (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) {
          reject(err);
        } else {
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