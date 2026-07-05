import axios from 'axios';

// Mapa símbolo -> id da CoinGecko (a API não aceita ticker, exige o "id" dela).
// Mesma lista de moedas oferecida no formulário de "Adicionar Ativo" do front.
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  USDT: 'tether',
};

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  value: Record<string, number>;
  expiresAt: number;
}

/**
 * Isola toda chamada à CoinGecko num único lugar e cacheia o resultado em memória.
 *
 * Por quê cache: o plano free da CoinGecko libera poucas chamadas por minuto
 * (ao contrário da Binance, que é bem mais permissiva) — sem cache, um dashboard
 * com auto-refresh de poucos segundos toma "429 Too Many Requests" rapidinho.
 * Cache em memória (Map) é suficiente aqui porque o backend roda como processo
 * único; se um dia escalar para múltiplas instâncias, essa mesma interface
 * poderia trocar o Map por Redis sem o resto do código perceber.
 */
export class PriceService {
  private cache = new Map<string, CacheEntry>();

  async getPrices(symbols: string[]): Promise<Record<string, number>> {
    const uniqueSymbols = [...new Set(symbols)].filter(s => COINGECKO_IDS[s]);
    if (uniqueSymbols.length === 0) return {};

    const cacheKey = uniqueSymbols.slice().sort().join(',');
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const ids = uniqueSymbols.map(s => COINGECKO_IDS[s]).join(',');
    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids, vs_currencies: 'brl' },
        timeout: 5000,
      });

      const result: Record<string, number> = {};
      for (const symbol of uniqueSymbols) {
        const id = COINGECKO_IDS[symbol]!;
        if (data[id]?.brl) result[symbol] = data[id].brl;
      }

      this.cache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch {
      // CoinGecko fora do ar ou rate-limited: devolve o último cache válido (mesmo
      // expirado) em vez de derrubar a tela do usuário com preço zerado.
      return cached?.value ?? {};
    }
  }

  async getBitcoinPrice(): Promise<{ moeda: string; simbolo: string; paridade: string; valor: number; origem: string }> {
    const prices = await this.getPrices(['BTC']);
    const valor = prices['BTC'];
    if (valor) {
      return { moeda: 'Bitcoin', simbolo: 'BTC', paridade: 'BRL', valor, origem: 'CoinGecko' };
    }
    return {
      moeda: 'Bitcoin', simbolo: 'BTC', paridade: 'BRL',
      valor: 589420 + Math.round((Math.random() - 0.5) * 1000), origem: 'Mock',
    };
  }
}
