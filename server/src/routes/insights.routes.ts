import { Router } from 'express';
import { authMiddleware } from '../utils/auth.middleware';
import { getInsights, chatInsights } from '../controllers/insights.controller';
import { validate } from '../utils/validate';
import { chatSchema } from '../validators/insights.schema';

const router = Router();
router.get('/', authMiddleware, getInsights);
router.post('/chat', authMiddleware, validate(chatSchema), chatInsights);
export default router;
