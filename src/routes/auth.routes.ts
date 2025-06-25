import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateLogin, validateRegistration } from '../middleware/validation.middleware';

const router = Router();

// Auth routes
router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router; 