import { AssetRepository, TransactionRepository } from '../../domain/repositories';
import { PriceService } from '../../services/PriceService';
import { InsightsService } from '../../services/InsightsService';

// Este use case é o "orquestrador": busca os dados brutos nos repositórios,
// busca cotação ao vivo no PriceService e entrega tudo pronto pro InsightsService
// analisar. Nenhuma dessas três peças conhece as outras duas diretamente.
export class GetInsightsUseCase {
  constructor(
    private readonly assets: AssetRepository,
    private readonly transactions: TransactionRepository,
    private readonly prices: PriceService,
    private readonly insights: InsightsService,
  ) {}

  async execute(userId: string) {
    const [userAssets, userTransactions] = await Promise.all([
      this.assets.findAllByUser(userId),
      this.transactions.findAllByUser(userId),
    ]);

    const symbols = userAssets.map(a => a.symbol);
    const prices = await this.prices.getPrices(symbols);

    return this.insights.generate({ assets: userAssets, transactions: userTransactions, prices });
  }
}
