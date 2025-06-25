import { body, ValidationChain } from 'express-validator';

export const validateRegistration: ValidationChain[] = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters long')
];

export const validateLogin: ValidationChain[] = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ max: 50 })
    .withMessage('Username is too long')
    .trim()
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 100 })
    .withMessage('Password is too long')
]; 