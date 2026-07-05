import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { validate } from '../utils/validate';
import { registerSchema, loginSchema } from '../validators/auth.schema';
import { authLimiter } from '../utils/rate-limit';
const router = Router();
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
export default router;
