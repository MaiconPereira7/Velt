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

const ALLOWED_DAYS = [1, 7, 30, 90];

export async function getPriceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const coinId = req.params['coinId']!;
    const days = Number(req.query['days'] ?? 7);

    if (!ALLOWED_DAYS.includes(days)) {
      throw new AppError(400, 'Parâmetro days deve ser um dos valores: 1, 7, 30, 90.');
    }

    res.json(await container.priceService.getMarketChart(coinId, days));
  } catch (err) {
    next(err);
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

export async function updateAsset(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await container.updateAsset.execute(req.user!.userId, req.params['id']!, req.body));
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

export async function searchCoins(req: Request, res: Response, next: NextFunction) {
  try {
    const q = String(req.query['q'] ?? '');
    res.json(await container.priceService.searchCoins(q));
  } catch (err) {
    next(err);
  }
}
