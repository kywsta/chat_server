import { Request, Response, Router } from 'express';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'OK', message: 'Chat server is running' });
});

export default router; 