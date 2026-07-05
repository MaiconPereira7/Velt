export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CryptoAsset {
  id: string;
  coin: string;
  symbol: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface BitcoinPrice {
  moeda: string;
  simbolo: string;
  paridade: string;
  valor: number;
  origem: string;
}

export interface InsightMessage {
  title: string;
  body: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}
