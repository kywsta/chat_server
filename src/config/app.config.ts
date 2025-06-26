import dotenv from 'dotenv';
import { DatabaseType } from '../database/database.factory';

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
  },
  database: {
    type: (process.env.DATABASE_TYPE as DatabaseType) || 'memory',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'chat_db',
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    ssl: process.env.DATABASE_SSL === 'true',
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000', 10)
  }
} as const; 