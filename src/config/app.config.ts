import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: '24h',
  bcryptSaltRounds: 10,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
} as const; 