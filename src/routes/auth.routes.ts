import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Auth routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router; 