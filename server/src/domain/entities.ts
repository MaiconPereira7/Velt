// Camada de domínio: descreve o "o quê" (os dados do negócio), nunca o "como"
// são guardados. Nada aqui importa Firestore, Express ou qualquer biblioteca externa —
// é o que sobra se você trocar o banco ou o framework HTTP inteiro.

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  userId: string;
  coin: string;
  symbol: string;
  amount: number;
  avgPrice: number;
  icon: string;
  color: string;
  createdAt: Date;
}

export type TransactionType = 'entrada' | 'saida';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string; // formato ISO (YYYY-MM-DD), como vem do <input type="date">
  createdAt: Date;
}
