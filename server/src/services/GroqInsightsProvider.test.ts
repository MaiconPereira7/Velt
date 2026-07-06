import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { GroqInsightsProvider } from './GroqInsightsProvider';
import { Asset } from '../domain/entities';

vi.mock('axios');

function asset(over: Partial<Asset>): Asset {
  return {
    id: '1', userId: 'user-1', coin: 'Bitcoin', symbol: 'BTC',
    amount: 1, avgPrice: 100000, icon: '₿', color: '#f7931a', createdAt: new Date(),
    ...over,
  };
}

describe('GroqInsightsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyze', () => {
    it('não chama a API quando não há ativos nem transações (usa fallback determinístico)', async () => {
      const provider = new GroqInsightsProvider('fake-key');
      const result = await provider.analyze({ assets: [], transactions: [], prices: {} });

      expect(axios.post).not.toHaveBeenCalled();
      expect(result[0]?.title).toBe('Sem dados ainda');
    });

    it('faz parse da resposta da Groq quando a chamada tem sucesso', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { choices: [{ message: { content: JSON.stringify({ insights: [{ title: 'Teste', body: 'Corpo do teste' }] }) } }] },
      });

      const provider = new GroqInsightsProvider('fake-key');
      const result = await provider.analyze({ assets: [asset({})], transactions: [], prices: { BTC: 120000 } });

      expect(result).toEqual([{ title: 'Teste', body: 'Corpo do teste' }]);
    });

    it('cai pro fallback determinístico se a chamada à Groq falhar', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('network error'));

      const provider = new GroqInsightsProvider('fake-key');
      const result = await provider.analyze({ assets: [asset({})], transactions: [], prices: { BTC: 120000 } });

      expect(result.some(m => m.title.includes('Diversificação'))).toBe(true);
    });
  });

  describe('chat', () => {
    it('responde a pergunta livre com sucesso', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { choices: [{ message: { content: 'Você tem R$ 100,00 investidos.' } }] },
      });

      const provider = new GroqInsightsProvider('fake-key');
      const answer = await provider.chat('quanto tenho investido?', { assets: [], transactions: [], prices: {} });

      expect(answer).toBe('Você tem R$ 100,00 investidos.');
    });

    it('retorna mensagem amigável quando a Groq responde 429 (rate limit)', async () => {
      vi.mocked(axios.post).mockRejectedValue({ response: { status: 429 } });
      vi.mocked(axios).isAxiosError = vi.fn().mockReturnValue(true) as any;

      const provider = new GroqInsightsProvider('fake-key');
      const answer = await provider.chat('quanto tenho investido?', { assets: [], transactions: [], prices: {} });

      expect(answer).toContain('limite de uso');
    });

    it('retorna mensagem amigável quando a chave é inválida (401)', async () => {
      vi.mocked(axios.post).mockRejectedValue({ response: { status: 401 } });
      vi.mocked(axios).isAxiosError = vi.fn().mockReturnValue(true) as any;

      const provider = new GroqInsightsProvider('fake-key');
      const answer = await provider.chat('quanto tenho investido?', { assets: [], transactions: [], prices: {} });

      expect(answer).toContain('chave de API');
    });
  });
});
