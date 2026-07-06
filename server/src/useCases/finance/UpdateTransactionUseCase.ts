import { TransactionRepository } from '../../domain/repositories';
import { AppError } from '../../utils/error.middleware';

export interface UpdateTransactionInput {
  description?: string;
  category?: string;
  amount?: number;
  date?: string;
}

export class UpdateTransactionUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string, txId: string, input: UpdateTransactionInput) {
    const tx = await this.transactions.findById(txId);
    // Mesma checagem de posse do RemoveTransactionUseCase — aqui falha com 404
    // em vez de silenciar, porque quem chama PUT espera o recurso atualizado.
    if (!tx || tx.userId !== userId) {
      throw new AppError(404, 'Transação não encontrada.');
    }

    if (Object.keys(input).length === 0) {
      throw new AppError(400, 'Informe ao menos um campo para atualizar.');
    }
    if (input.amount !== undefined && input.amount <= 0) {
      throw new AppError(400, 'Amount deve ser positivo.');
    }

    return this.transactions.update(txId, input);
  }
}
