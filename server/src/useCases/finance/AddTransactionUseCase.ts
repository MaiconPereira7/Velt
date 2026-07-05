import { TransactionRepository } from '../../domain/repositories';
import { TransactionType } from '../../domain/entities';
import { AppError } from '../../utils/error.middleware';

export interface AddTransactionInput {
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export class AddTransactionUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string, input: AddTransactionInput) {
    if (!input.type || !input.category || !input.amount || !input.date) {
      throw new AppError(400, 'Campos obrigatórios: type, category, amount, date.');
    }
    return this.transactions.create({
      userId,
      type: input.type,
      category: input.category,
      description: input.description ?? '',
      amount: input.amount,
      date: input.date,
    });
  }
}
