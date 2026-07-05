import { TransactionRepository } from '../../domain/repositories';

export class GetTransactionsUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  execute(userId: string) {
    return this.transactions.findAllByUser(userId);
  }
}
