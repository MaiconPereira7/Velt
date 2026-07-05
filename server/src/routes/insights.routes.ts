import { Router } from 'express';
import { authMiddleware } from '../utils/auth.middleware';
import { getInsights } from '../controllers/insights.controller';

const router = Router();
router.get('/', authMiddleware, getInsights);
export default router;
