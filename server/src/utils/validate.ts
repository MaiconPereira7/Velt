import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

// Middleware genérico de validação: recebe um schema Zod e garante que
// req.body está no formato esperado antes de chegar no controller.
export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues.map((issue) => issue.message).join(', ') });
      return;
    }
    req.body = result.data;
    next();
  };
}
