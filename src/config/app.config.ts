import { LoggerUtil } from '../utils/logger.util';

export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  jwtSecret: string;
  bcryptSaltRounds: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
  };
  database: {
    type: 'memory';
  };
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
  },
  logging: {
    level: (process.env.LOG_LEVEL as AppConfig['logging']['level']) || 'info',
  },
  database: {
    type: 'memory',
  },
};

// Validate required environment variables in production
if (config.environment === 'production') {
  const requiredEnvVars = ['JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    LoggerUtil.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }
}

export const appConfig = config; 