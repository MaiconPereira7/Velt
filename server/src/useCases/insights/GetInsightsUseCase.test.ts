import { describe, it, expect } from 'vitest';
import { GetInsightsUseCase } from './GetInsightsUseCase';
import { InMemoryAssetRepository } from '../../infra/memory/InMemoryAssetRepository';
import { InMemoryTransactionRepository } from '../../infra/memory/InMemoryTransactionRepository';
import { InsightsService, DeterministicInsightsProvider } from '../../services/InsightsService';
import { PriceService } from '../../services/PriceService';

// Fake mínimo do PriceService: evita chamada de rede real à CoinGecko no teste.
function fakePriceService(prices: Record<string, number>): PriceService {
  return { getPrices: async () => prices } as unknown as PriceService;
}

describe('GetInsightsUseCase', () => {
  it('deve retornar alerta de concentração quando um ativo tem mais de 70% da carteira', async () => {
    const assets = new InMemoryAssetRepository();
    const transactions = new InMemoryTransactionRepository();
    await assets.create({ userId: 'user-1', coin: 'Bitcoin', symbol: 'BTC', amount: 1, avgPrice: 100000, icon: '₿', color: '#f7931a' });
    await assets.create({ userId: 'user-1', coin: 'Ethereum', symbol: 'ETH', amount: 1, avgPrice: 1000, icon: 'Ξ', color: '#627eea' });

    const prices = fakePriceService({ BTC: 500000, ETH: 1000 }); // BTC passa a dominar a carteira
    const insights = new InsightsService(new DeterministicInsightsProvider());
    const useCase = new GetInsightsUseCase(assets, transactions, prices, insights);

    const result = await useCase.execute('user-1');
    const diversification = result.find(m => m.title.includes('Diversificação'));

    expect(diversification?.body).toContain('rebalancear');
  });

  it('deve retornar análise de gastos com taxa de poupança correta', async () => {
    const assets = new InMemoryAssetRepository();
    const transactions = new InMemoryTransactionRepository();
    await transactions.create({ userId: 'user-1', type: 'entrada', category: 'Salário', description: '', amount: 1000, date: '2026-01-01' });
    await transactions.create({ userId: 'user-1', type: 'saida', category: 'Alimentação', description: '', amount: 500, date: '2026-01-02' });

    const prices = fakePriceService({});
    const insights = new InsightsService(new DeterministicInsightsProvider());
    const useCase = new GetInsightsUseCase(assets, transactions, prices, insights);

    const result = await useCase.execute('user-1');
    const spending = result.find(m => m.title.includes('Gastos'));

    expect(spending?.body).toContain('50.0%');
  });
});
