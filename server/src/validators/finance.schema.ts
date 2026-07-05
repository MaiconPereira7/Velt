import { z } from 'zod';

export const addTransactionSchema = z.object({
  type: z.enum(['entrada', 'saida'], { message: 'Type deve ser "entrada" ou "saida".' }),
  category: z.string().min(1, 'Categoria é obrigatória.'),
  description: z.string().optional(),
  amount: z.number().positive('Amount deve ser positivo.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date deve estar no formato ISO (YYYY-MM-DD).'),
});
