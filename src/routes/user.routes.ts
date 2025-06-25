import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// User routes
router.get('/', authenticateToken, UserController.getAllUsers);

export default router; 