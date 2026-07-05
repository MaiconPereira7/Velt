import { Request, Response } from 'express';
import { container } from '../container';

export async function getBitcoin(_req: Request, res: Response) {
  try { res.json(await container.priceService.getBitcoinPrice()); }
  catch { res.status(502).json({ error: 'Falha ao buscar preço do Bitcoin.' }); }
}

export async function getAssets(req: Request, res: Response) {
  try {
    res.json(await container.getAssets.execute(req.user!.id));
  } catch (err) {
    console.error('[crypto.controller] getAssets:', err);
    res.status(500).json({ error: 'Falha ao buscar ativos.' });
  }
}

export async function createAsset(req: Request, res: Response) {
  try {
    res.status(201).json(await container.addAsset.execute(req.user!.id, req.body));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteAsset(req: Request, res: Response) {
  try {
    await container.removeAsset.execute(req.user!.id, req.params['id']!);
    res.status(204).send();
  } catch (err) {
    console.error('[crypto.controller] deleteAsset:', err);
    res.status(500).json({ error: 'Falha ao remover ativo.' });
  }
}
