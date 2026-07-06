import { z } from 'zod';

export const addAssetSchema = z.object({
  coin: z.string().min(1, 'Coin é obrigatório.'),
  symbol: z.string().min(1, 'Symbol é obrigatório.'),
  coinId: z.string().optional(),
  amount: z.number().positive('Amount deve ser positivo.'),
  avgPrice: z.number().positive('AvgPrice deve ser positivo.'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateAssetSchema = z.object({
  amount: z.number().positive('Amount deve ser positivo.').optional(),
  avgPrice: z.number().positive('AvgPrice deve ser positivo.').optional(),
}).refine(data => data.amount !== undefined || data.avgPrice !== undefined, {
  message: 'Informe amount e/ou avgPrice para atualizar.',
});
