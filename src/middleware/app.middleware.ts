import { NextFunction, Request, Response } from 'express';
import { LoggerUtil } from '../utils/logger.util';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request
  LoggerUtil.info('Incoming request:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const duration = Date.now() - start;
    LoggerUtil.info('Request completed:', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

export const corsHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}; 