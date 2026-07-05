import { z } from 'zod';

export const addAssetSchema = z.object({
  coin: z.string().min(1, 'Coin é obrigatório.'),
  symbol: z.string().min(1, 'Symbol é obrigatório.'),
  amount: z.number().positive('Amount deve ser positivo.'),
  avgPrice: z.number().positive('AvgPrice deve ser positivo.'),
  icon: z.string().optional(),
  color: z.string().optional(),
});
