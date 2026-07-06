import { Request, Response, NextFunction } from 'express';
import { container } from '../container';

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await container.getTransactions.execute(req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await container.addTransaction.execute(req.user!.userId, req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await container.updateTransaction.execute(req.user!.userId, req.params['id']!, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    await container.removeTransaction.execute(req.user!.userId, req.params['id']!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
