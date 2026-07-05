import { describe, it, expect } from 'vitest';
import { DeterministicInsightsProvider } from './InsightsService';
import { Asset, Transaction } from '../domain/entities';

function asset(over: Partial<Asset>): Asset {
  return {
    id: '1', userId: 'user-1', coin: 'Bitcoin', symbol: 'BTC',
    amount: 1, avgPrice: 100000, icon: '₿', color: '#f7931a', createdAt: new Date(),
    ...over,
  };
}

function transaction(over: Partial<Transaction>): Transaction {
  return {
    id: '1', userId: 'user-1', type: 'entrada', category: 'Outros',
    description: '', amount: 0, date: '2026-01-01', createdAt: new Date(),
    ...over,
  };
}

describe('DeterministicInsightsProvider', () => {
  const provider = new DeterministicInsightsProvider();

  it('deve retornar "Sem dados ainda" quando não há ativos nem transações', async () => {
    const result = await provider.analyze({ assets: [], transactions: [], prices: {} });

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Sem dados ainda');
  });

  it('deve alertar concentração quando um ativo tem 100% da carteira', async () => {
    const result = await provider.analyze({
      assets: [asset({ symbol: 'BTC', amount: 1, avgPrice: 100000 })],
      transactions: [],
      prices: { BTC: 200000 },
    });

    const diversification = result.find(m => m.title.includes('Diversificação'));
    expect(diversification?.body).toContain('rebalancear');
  });

  it('deve calcular taxa de poupança corretamente', async () => {
    const transactions = [
      transaction({ type: 'entrada', amount: 2000, date: '2026-01-01' }),
      transaction({ type: 'saida', amount: 500, date: '2026-01-02' }),
    ];

    const result = await provider.analyze({ assets: [], transactions, prices: {} });
    const spending = result.find(m => m.title.includes('Gastos'));

    expect(spending?.body).toContain('75.0%');
  });
});
