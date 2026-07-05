import { TransactionRepository } from '../../domain/repositories';

export class RemoveTransactionUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string, txId: string): Promise<void> {
    const tx = await this.transactions.findById(txId);
    if (!tx || tx.userId !== userId) return; // mesma checagem de posse do RemoveAssetUseCase
    await this.transactions.delete(txId);
  }
}
