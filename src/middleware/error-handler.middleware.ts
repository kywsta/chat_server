import { NextFunction, Request, Response } from 'express';
import { LoggerUtil } from '../utils/logger.util';

export interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  LoggerUtil.error('Error occurred:', {
    error: message,
    status,
    path: req.path,
    method: req.method,
    stack: error.stack
  });

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  LoggerUtil.warn('Route not found:', {
    path: req.path,
    method: req.method
  });

  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.path
    }
  });
}; 