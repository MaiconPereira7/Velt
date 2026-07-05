import { AssetRepository } from '../../domain/repositories';
import { PriceService } from '../../services/PriceService';

export interface AssetWithQuote {
  id: string;
  coin: string;
  symbol: string;
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

    const symbols = userAssets.map(a => a.symbol);
    const quotes = await this.prices.getPrices(symbols);

    return userAssets.map(a => ({
      id: a.id,
      coin: a.coin,
      symbol: a.symbol,
      amount: a.amount,
      avgPrice: a.avgPrice,
      currentPrice: quotes[a.symbol] ?? a.avgPrice,
      icon: a.icon,
      color: a.color,
    }));
  }
}
