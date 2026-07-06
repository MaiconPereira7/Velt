import { describe, it, expect, vi } from 'vitest';
import { ChatInsightsUseCase } from './ChatInsightsUseCase';
import { InMemoryAssetRepository } from '../../infra/memory/InMemoryAssetRepository';
import { InMemoryTransactionRepository } from '../../infra/memory/InMemoryTransactionRepository';
import { PriceService } from '../../services/PriceService';
import { ChatCapableProvider } from '../../services/InsightsService';

describe('ChatInsightsUseCase', () => {
  it('busca os dados do usuário e repassa pro provider.chat()', async () => {
    const assets = new InMemoryAssetRepository();
    const transactions = new InMemoryTransactionRepository();
    await assets.create({ userId: 'user-1', coin: 'Bitcoin', symbol: 'BTC', amount: 1, avgPrice: 100000, icon: '₿', color: '#f7931a' });

    const prices = { getPrices: vi.fn().mockResolvedValue({ BTC: 120000 }) } as unknown as PriceService;
    // Objeto simples satisfaz ChatCapableProvider estruturalmente — não precisa
    // simular uma classe concreta específica (Groq, Gemini, etc).
    const provider: ChatCapableProvider = { chat: vi.fn().mockResolvedValue('Você tem 1 BTC.') };

    const useCase = new ChatInsightsUseCase(assets, transactions, prices, provider);
    const answer = await useCase.execute('user-1', 'quanto BTC eu tenho?');

    expect(answer).toBe('Você tem 1 BTC.');
    expect(provider.chat).toHaveBeenCalledWith(
      'quanto BTC eu tenho?',
      expect.objectContaining({ prices: { BTC: 120000 } }),
    );
  });
});
