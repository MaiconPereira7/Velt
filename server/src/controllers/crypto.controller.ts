import { Request, Response, NextFunction } from 'express';
import { container } from '../container';
import { AppError } from '../utils/error.middleware';

export async function getBitcoin(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await container.priceService.getBitcoinPrice());
  } catch {
    next(new AppError(502, 'Falha ao buscar preço do Bitcoin.'));
  }
}

export async function getAssets(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await container.getAssets.execute(req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function createAsset(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await container.addAsset.execute(req.user!.userId, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteAsset(req: Request, res: Response, next: NextFunction) {
  try {
    await container.removeAsset.execute(req.user!.userId, req.params['id']!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
