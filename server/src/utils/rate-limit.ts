import rateLimit from 'express-rate-limit';

// Limita tentativas de login/registro para dificultar ataques de força bruta.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
});
