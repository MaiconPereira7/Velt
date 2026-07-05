import { Request, Response } from 'express';
import { container } from '../container';

export async function listTransactions(req: Request, res: Response) {
  try {
    res.json(await container.getTransactions.execute(req.user!.id));
  } catch (err) {
    console.error('[finance.controller] listTransactions:', err);
    res.status(500).json({ error: 'Falha ao buscar transações.' });
  }
}

export async function createTransaction(req: Request, res: Response) {
  try {
    res.status(201).json(await container.addTransaction.execute(req.user!.id, req.body));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteTransaction(req: Request, res: Response) {
  try {
    await container.removeTransaction.execute(req.user!.id, req.params['id']!);
    res.status(204).send();
  } catch (err) {
    console.error('[finance.controller] deleteTransaction:', err);
    res.status(500).json({ error: 'Falha ao remover transação.' });
  }
}
