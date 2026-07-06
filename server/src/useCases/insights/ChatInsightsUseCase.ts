import { AssetRepository, TransactionRepository } from '../../domain/repositories';
import { PriceService } from '../../services/PriceService';
import { ChatCapableProvider } from '../../services/InsightsService';

// Mesmo padrão orquestrador do GetInsightsUseCase: busca os dados brutos nos
// repositórios, busca cotação ao vivo no PriceService, e entrega tudo pronto
// pro provider de IA responder a pergunta livre do usuário. Depende só da
// porta ChatCapableProvider — não sabe (nem precisa saber) se é Groq, Gemini
// ou outro provider generativo qualquer.
export class ChatInsightsUseCase {
  constructor(
    private readonly assets: AssetRepository,
    private readonly transactions: TransactionRepository,
    private readonly prices: PriceService,
    private readonly provider: ChatCapableProvider,
  ) {}

  async execute(userId: string, question: string): Promise<string> {
    const [userAssets, userTransactions] = await Promise.all([
      this.assets.findAllByUser(userId),
      this.transactions.findAllByUser(userId),
    ]);

    const symbols = userAssets.map(a => a.symbol);
    const prices = await this.prices.getPrices(symbols);

    return this.provider.chat(question, { assets: userAssets, transactions: userTransactions, prices });
  }
}
