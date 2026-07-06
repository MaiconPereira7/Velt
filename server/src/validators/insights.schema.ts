import { z } from 'zod';

export const chatSchema = z.object({
  question: z.string().min(1, 'Question é obrigatória.'),
});
