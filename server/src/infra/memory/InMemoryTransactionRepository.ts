import { randomUUID } from 'crypto';
import { Transaction } from '../../domain/entities';
import { TransactionRepository } from '../../domain/repositories';

// Implementação em memória do TransactionRepository: usada nos testes de use case,
// sem precisar subir Firestore nem mockar chamadas de rede.
export class InMemoryTransactionRepository implements TransactionRepository {
  private transactions: Transaction[] = [];

  async findAllByUser(userId: string): Promise<Transaction[]> {
    return this.transactions.filter(t => t.userId === userId);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.find(t => t.id === id) ?? null;
  }

  async create(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const transaction: Transaction = { id: randomUUID(), createdAt: new Date(), ...data };
    this.transactions.push(transaction);
    return transaction;
  }

  async delete(id: string): Promise<void> {
    this.transactions = this.transactions.filter(t => t.id !== id);
  }
}
