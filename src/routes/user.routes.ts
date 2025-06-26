import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', UserController.getAllUsers);
router.get('/stats', UserController.getUserStats);
router.get('/id/:id', UserController.getUserById);
router.get('/username/:username', UserController.getUserByUsername);

// Protected routes (require authentication)
router.put('/password', authenticateToken, UserController.updatePassword);

export default router; 