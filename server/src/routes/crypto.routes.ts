import { Router } from 'express';
import { authMiddleware } from '../utils/auth.middleware';
import { getBitcoin, getAssets, createAsset, deleteAsset } from '../controllers/crypto.controller';
const router = Router();
router.get('/bitcoin', getBitcoin);
router.get('/assets',        authMiddleware, getAssets);
router.post('/assets',       authMiddleware, createAsset);
router.delete('/assets/:id', authMiddleware, deleteAsset);
export default router;
