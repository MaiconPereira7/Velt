import { AssetRepository } from '../../domain/repositories';
import { PriceService } from '../../services/PriceService';

export interface AssetWithQuote {
  id: string;
  coin: string;
  symbol: string;
  coinId?: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  icon: string;
  color: string;
}

// Por que currentPrice é calculado aqui e não lido de uma coluna: cotação de
// mercado muda a cada segundo, então persistir isso no banco só garante que
// o valor vai estar desatualizado no instante seguinte. O use case busca o
// preço "ao vivo" (com cache) e junta com o dado persistido na hora da leitura.
export class GetAssetsUseCase {
  constructor(
    private readonly assets: AssetRepository,
    private readonly prices: PriceService,
  ) {}

  async execute(userId: string): Promise<AssetWithQuote[]> {
    const userAssets = await this.assets.findAllByUser(userId);
    if (userAssets.length === 0) return [];

    // Ativos com coinId (cadastrados via busca) cotam por id da CoinGecko —
    // funciona pra qualquer moeda. Ativos antigos, sem coinId, caem no mapa
    // fixo symbol -> id (só cobre os presets originais).
    const withCoinId = userAssets.filter(a => a.coinId);
    const legacy = userAssets.filter(a => !a.coinId);

    const [idQuotes, symbolQuotes] = await Promise.all([
      this.prices.getPricesByIds(withCoinId.map(a => a.coinId!)),
      this.prices.getPrices(legacy.map(a => a.symbol)),
    ]);

    return userAssets.map(a => ({
      id: a.id,
      coin: a.coin,
      symbol: a.symbol,
      coinId: a.coinId,
      amount: a.amount,
      avgPrice: a.avgPrice,
      currentPrice: (a.coinId ? idQuotes[a.coinId] : symbolQuotes[a.symbol]) ?? a.avgPrice,
      icon: a.icon,
      color: a.color,
    }));
  }
}
