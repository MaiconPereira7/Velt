// "Portas" do domínio: contratos que a regra de negócio (useCases) depende,
// sem saber que quem implementa é o Firestore. Essa inversão é o que permite
// trocar Firestore por Postgres/Mongo/memória sem tocar em nenhuma regra de negócio
// nem escrever um teste de use case contra um banco de verdade (dá pra usar um fake).

import { Asset, Transaction, User } from './entities';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
}

export interface AssetRepository {
  findAllByUser(userId: string): Promise<Asset[]>;
  findById(id: string): Promise<Asset | null>;
  create(data: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset>;
  update(id: string, data: Partial<Pick<Asset, 'amount' | 'avgPrice'>>): Promise<Asset>;
  delete(id: string): Promise<void>;
}

export interface TransactionRepository {
  findAllByUser(userId: string): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  create(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  update(id: string, data: Partial<Pick<Transaction, 'description' | 'category' | 'amount' | 'date'>>): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
