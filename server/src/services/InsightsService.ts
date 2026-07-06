import { Asset, Transaction } from '../domain/entities';

export interface InsightMessage {
  title: string;
  body: string;
}

export interface InsightsInput {
  assets: Asset[];
  transactions: Transaction[];
  prices: Record<string, number>; // symbol -> preço atual em BRL
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Porta (interface) que o InsightsService depende — não o contrário.
 * Hoje só existe a implementação determinística abaixo (sem custo, sem chave de
 * API, sem dependência de terceiros). O dia que quiser plugar um LLM de verdade
 * (OpenAI/Gemini), basta escrever uma outra classe que implementa AiProvider e
 * trocar a injeção lá no container — nenhum controller ou use case muda.
 */
export interface AiProvider {
  analyze(input: InsightsInput): Promise<InsightMessage[]>;
}

/**
 * Gera análises reais a partir dos dados do usuário (nada de texto fixo).
 * É "regra de negócio determinística", não IA generativa — mas responde de
 * verdade à pergunta feita, o que já resolve o problema de a resposta não
 * bater com a pergunta (bug que existia na versão 100% mockada no front).
 */
export class DeterministicInsightsProvider implements AiProvider {
  async analyze({ assets, transactions, prices }: InsightsInput): Promise<InsightMessage[]> {
    const messages: InsightMessage[] = [];

    if (assets.length > 0) {
      messages.push(this.diversification(assets, prices));
    }
    if (transactions.length > 0) {
      messages.push(this.spending(transactions));
    }
    if (assets.length > 0) {
      messages.push(this.volatilityAlert(assets, prices));
    }

    if (messages.length === 0) {
      messages.push({
        title: 'Sem dados ainda',
        body: 'Adicione ativos na Carteira e transações em Finanças para eu conseguir gerar uma análise real da sua situação.',
      });
    }

    return messages;
  }

  private diversification(assets: Asset[], prices: Record<string, number>): InsightMessage {
    const withValue = assets.map(a => ({
      ...a,
      currentValue: a.amount * (prices[a.symbol] ?? a.avgPrice),
    }));
    const total = withValue.reduce((sum, a) => sum + a.currentValue, 0);
    const bySize = [...withValue].sort((a, b) => b.currentValue - a.currentValue);
    const top = bySize[0]!;
    const topPct = total > 0 ? (top.currentValue / total) * 100 : 0;

    let recommendation = 'Sua carteira está bem distribuída entre os ativos.';
    if (topPct >= 70) {
      recommendation = `Considere rebalancear: ${topPct.toFixed(0)}% concentrado em ${top.symbol} é uma exposição alta a um único ativo.`;
    } else if (topPct >= 40) {
      recommendation = `${top.symbol} representa ${topPct.toFixed(0)}% da carteira — razoável, mas vale monitorar a concentração.`;
    }

    return {
      title: 'Diversificação da Carteira',
      body: `Você tem ${assets.length} ativo(s) somando R$ ${brl(total)}. ${recommendation}`,
    };
  }

  private spending(transactions: Transaction[]): InsightMessage {
    const income = transactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'saida').reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    let assessment = 'Taxa de poupança neutra — dá pra melhorar organizando os gastos por categoria.';
    if (savingsRate >= 50) assessment = 'Taxa de poupança excelente — você está guardando mais da metade do que ganha.';
    else if (savingsRate < 0) assessment = 'Atenção: suas despesas superaram as receitas neste período.';

    return {
      title: 'Gastos e Economia',
      body: `Receita: R$ ${brl(income)} · Despesas: R$ ${brl(expense)} · Taxa de poupança: ${savingsRate.toFixed(1)}%. ${assessment}`,
    };
  }

  private volatilityAlert(assets: Asset[], prices: Record<string, number>): InsightMessage {
    const withPnl = assets
      .filter(a => prices[a.symbol])
      .map(a => ({ symbol: a.symbol, pnlPct: ((prices[a.symbol]! - a.avgPrice) / a.avgPrice) * 100 }));

    if (withPnl.length === 0) {
      return {
        title: 'Alertas de Volatilidade',
        body: 'Ainda não tenho cotação ao vivo suficiente para avaliar a volatilidade dos seus ativos.',
      };
    }

    const biggestMove = withPnl.reduce((a, b) => (Math.abs(b.pnlPct) > Math.abs(a.pnlPct) ? b : a));
    const direction = biggestMove.pnlPct >= 0 ? 'valorização' : 'queda';

    return {
      title: 'Alertas de Volatilidade',
      body: `${biggestMove.symbol} é o ativo com maior variação da carteira: ${direction} de ${Math.abs(biggestMove.pnlPct).toFixed(1)}% frente ao seu preço médio.`,
    };
  }
}

export class InsightsService {
  constructor(private readonly provider: AiProvider) {}

  generate(input: InsightsInput): Promise<InsightMessage[]> {
    return this.provider.analyze(input);
  }
}
