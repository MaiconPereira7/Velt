import { Request, Response, NextFunction } from 'express';
import { container } from '../container';

export async function getInsights(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await container.getInsights.execute(req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function chatInsights(req: Request, res: Response, next: NextFunction) {
  try {
    if (!container.chatInsights) {
      res.status(501).json({ error: 'Chat com IA não está configurado. Defina GEMINI_API_KEY no servidor.' });
      return;
    }

    const { question } = req.body;
    const answer = await container.chatInsights.execute(req.user!.userId, question);
    res.json({ answer });
  } catch (err) {
    next(err);
  }
}
