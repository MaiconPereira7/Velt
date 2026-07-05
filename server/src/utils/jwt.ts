import jwt from 'jsonwebtoken';
const SECRET = process.env['JWT_SECRET'] ?? 'crypto_secret_dev';

// Payload assinado no token: o que fica disponível em req.user após o authMiddleware.
export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
