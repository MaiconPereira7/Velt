import { Router } from 'express';
import { authMiddleware } from '../utils/auth.middleware';
import { listTransactions, createTransaction, deleteTransaction } from '../controllers/finance.controller';
const router = Router();
router.get('/',       authMiddleware, listTransactions);
router.post('/',      authMiddleware, createTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);
export default router;
