import { Request, Response } from 'express';
import { container } from '../container';

export async function getInsights(req: Request, res: Response) {
  try {
    res.json(await container.getInsights.execute(req.user!.id));
  } catch (err) {
    console.error('[insights.controller] getInsights:', err);
    res.status(500).json({ error: 'Falha ao gerar insights.' });
  }
}
