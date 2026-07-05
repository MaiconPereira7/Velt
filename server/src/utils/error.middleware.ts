import { Request, Response, NextFunction } from 'express';

// Erro de aplicação: carrega o status HTTP junto com a mensagem, para que o
// errorHandler saiba como responder sem precisar inspecionar o texto do erro.
export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

// Middleware de erro do Express: precisa dos 4 parâmetros para ser
// reconhecido como error handler, mesmo sem usar req e next diretamente.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('[errorHandler]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
}
