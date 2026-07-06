import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { OpenAIInsightsProvider } from './OpenAIInsightsProvider';
import { Asset } from '../domain/entities';

vi.mock('axios');

function asset(over: Partial<Asset>): Asset {
  return {
    id: '1', userId: 'user-1', coin: 'Bitcoin', symbol: 'BTC',
    amount: 1, avgPrice: 100000, icon: '₿', color: '#f7931a', createdAt: new Date(),
    ...over,
  };
}

describe('OpenAIInsightsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não chama a API quando não há ativos nem transações (usa fallback determinístico)', async () => {
    const provider = new OpenAIInsightsProvider('fake-key');
    const result = await provider.analyze({ assets: [], transactions: [], prices: {} });

    expect(axios.post).not.toHaveBeenCalled();
    expect(result[0]?.title).toBe('Sem dados ainda');
  });

  it('faz parse da resposta da OpenAI quando a chamada tem sucesso', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        choices: [{ message: { content: JSON.stringify({ insights: [{ title: 'Teste', body: 'Corpo do teste' }] }) } }],
      },
    });

    const provider = new OpenAIInsightsProvider('fake-key');
    const result = await provider.analyze({
      assets: [asset({})],
      transactions: [],
      prices: { BTC: 120000 },
    });

    expect(result).toEqual([{ title: 'Teste', body: 'Corpo do teste' }]);
  });

  it('cai pro fallback determinístico se a chamada à OpenAI falhar', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('network error'));

    const provider = new OpenAIInsightsProvider('fake-key');
    const result = await provider.analyze({
      assets: [asset({})],
      transactions: [],
      prices: { BTC: 120000 },
    });

    expect(result.some(m => m.title.includes('Diversificação'))).toBe(true);
  });
});
