import { Request, Response, NextFunction } from 'express';
import { container } from '../container';

export async function getInsights(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await container.getInsights.execute(req.user!.userId));
  } catch (err) {
    next(err);
  }
}
