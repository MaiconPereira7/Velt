import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { GeminiInsightsProvider } from './GeminiInsightsProvider';
import { Asset } from '../domain/entities';

vi.mock('axios');

function asset(over: Partial<Asset>): Asset {
  return {
    id: '1', userId: 'user-1', coin: 'Bitcoin', symbol: 'BTC',
    amount: 1, avgPrice: 100000, icon: '₿', color: '#f7931a', createdAt: new Date(),
    ...over,
  };
}

describe('GeminiInsightsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não chama a API quando não há ativos nem transações (usa fallback determinístico)', async () => {
    const provider = new GeminiInsightsProvider('fake-key');
    const result = await provider.analyze({ assets: [], transactions: [], prices: {} });

    expect(axios.post).not.toHaveBeenCalled();
    expect(result[0]?.title).toBe('Sem dados ainda');
  });

  it('faz parse da resposta do Gemini quando a chamada tem sucesso', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        candidates: [{ content: { parts: [{ text: JSON.stringify([{ title: 'Teste', body: 'Corpo do teste' }]) }] } }],
      },
    });

    const provider = new GeminiInsightsProvider('fake-key');
    const result = await provider.analyze({
      assets: [asset({})],
      transactions: [],
      prices: { BTC: 120000 },
    });

    expect(result).toEqual([{ title: 'Teste', body: 'Corpo do teste' }]);
  });

  it('cai pro fallback determinístico se a chamada ao Gemini falhar', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('network error'));

    const provider = new GeminiInsightsProvider('fake-key');
    const result = await provider.analyze({
      assets: [asset({})],
      transactions: [],
      prices: { BTC: 120000 },
    });

    expect(result.some(m => m.title.includes('Diversificação'))).toBe(true);
  });

  describe('chat', () => {
    it('responde a pergunta livre com sucesso', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { candidates: [{ content: { parts: [{ text: 'Você tem R$ 100,00 investidos.' }] } }] },
      });

      const provider = new GeminiInsightsProvider('fake-key');
      const answer = await provider.chat('quanto tenho investido?', { assets: [], transactions: [], prices: {} });

      expect(answer).toBe('Você tem R$ 100,00 investidos.');
    });

    it('retorna mensagem amigável quando o Gemini responde 429 (rate limit)', async () => {
      vi.mocked(axios.post).mockRejectedValue({ response: { status: 429 } });
      vi.mocked(axios).isAxiosError = vi.fn().mockReturnValue(true) as any;

      const provider = new GeminiInsightsProvider('fake-key');
      const answer = await provider.chat('quanto tenho investido?', { assets: [], transactions: [], prices: {} });

      expect(answer).toContain('limite de uso');
    });

    it('retorna mensagem amigável quando a chave é inválida (403)', async () => {
      vi.mocked(axios.post).mockRejectedValue({ response: { status: 403 } });
      vi.mocked(axios).isAxiosError = vi.fn().mockReturnValue(true) as any;

      const provider = new GeminiInsightsProvider('fake-key');
      const answer = await provider.chat('quanto tenho investido?', { assets: [], transactions: [], prices: {} });

      expect(answer).toContain('chave de API');
    });

    it('retorna mensagem amigável quando a credencial não autentica (401)', async () => {
      vi.mocked(axios.post).mockRejectedValue({ response: { status: 401 } });
      vi.mocked(axios).isAxiosError = vi.fn().mockReturnValue(true) as any;

      const provider = new GeminiInsightsProvider('fake-key');
      const answer = await provider.chat('quanto tenho investido?', { assets: [], transactions: [], prices: {} });

      expect(answer).toContain('chave de API');
    });
  });
});
