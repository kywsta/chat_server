import { body, ValidationChain } from 'express-validator';

export const validateRegistration: ValidationChain[] = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

export const validateLogin: ValidationChain[] = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim()
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]; 