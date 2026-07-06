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
const CHART_CACHE_TTL_MS = 5 * 60_000; // 5 minutos — histórico varia bem menos que o preço "spot"
const SEARCH_CACHE_TTL_MS = 10 * 60_000; // 10 minutos — nome/símbolo/ícone de uma moeda não muda

interface CacheEntry {
  value: Record<string, number>;
  expiresAt: number;
}

interface ChartCacheEntry {
  value: [number, number][];
  expiresAt: number;
}

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

interface SearchCacheEntry {
  value: CoinSearchResult[];
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
  private idCache = new Map<string, CacheEntry>();
  private chartCache = new Map<string, ChartCacheEntry>();
  private searchCache = new Map<string, SearchCacheEntry>();

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

  // Mesma ideia do getPrices, mas por id da CoinGecko em vez de símbolo — usado
  // pra ativos cadastrados via busca/autocomplete, que não estão no mapa fixo
  // COINGECKO_IDS (podem ser qualquer moeda listada na CoinGecko).
  async getPricesByIds(coinIds: string[]): Promise<Record<string, number>> {
    const uniqueIds = [...new Set(coinIds)].filter(Boolean);
    if (uniqueIds.length === 0) return {};

    const cacheKey = uniqueIds.slice().sort().join(',');
    const cached = this.idCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: uniqueIds.join(','), vs_currencies: 'brl' },
        timeout: 5000,
      });

      const result: Record<string, number> = {};
      for (const id of uniqueIds) {
        if (data[id]?.brl) result[id] = data[id].brl;
      }

      this.idCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch {
      return cached?.value ?? {};
    }
  }

  // Busca de moedas (autocomplete do formulário "Adicionar Ativo"). Cache mais
  // longo que o de preço: nome/símbolo/ícone de uma moeda praticamente não muda.
  async searchCoins(query: string): Promise<CoinSearchResult[]> {
    const key = query.trim().toLowerCase();
    if (!key) return [];

    const cached = this.searchCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/search', {
        params: { query: key },
        timeout: 5000,
      });

      const results: CoinSearchResult[] = (data.coins ?? [])
        .slice(0, 10)
        .map((c: { id: string; name: string; symbol: string; thumb: string }) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          thumb: c.thumb,
        }));

      this.searchCache.set(key, { value: results, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });
      return results;
    } catch {
      return cached?.value ?? [];
    }
  }

  // Histórico de preço pra alimentar o gráfico de linha (Carteira/Dashboard).
  // Mesmo padrão de cache do getPrices: evita bater na CoinGecko a cada clique
  // de período, e devolve o último cache válido se a API estiver fora do ar.
  async getMarketChart(coinId: string, days: number): Promise<[number, number][]> {
    const cacheKey = `${coinId}:${days}`;
    const cached = this.chartCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
        params: { vs_currency: 'brl', days },
        timeout: 8000,
      });

      const prices: [number, number][] = data.prices ?? [];
      this.chartCache.set(cacheKey, { value: prices, expiresAt: Date.now() + CHART_CACHE_TTL_MS });
      return prices;
    } catch {
      return cached?.value ?? [];
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
