import { Asset, Transaction } from '../domain/entities';
import { InsightsInput } from './InsightsService';

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Contexto financeiro compartilhado entre o modo "3 insights fixos" (analyze)
// e o chat de perguntas livres — os dois precisam descrever pro modelo os
// mesmos dados (portfólio com P&L, gastos por categoria, taxa de poupança),
// só a instrução final é que muda.
export function buildFinancialContext({ assets, transactions, prices }: InsightsInput): string {
  const income = transactions.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'saida').reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const totalInvested = assets.reduce((s, a) => s + a.amount * a.avgPrice, 0);
  const totalCurrent = assets.reduce((s, a) => s + a.amount * (prices[a.symbol] ?? a.avgPrice), 0);
  const pnl = totalCurrent - totalInvested;

  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'saida')
    .forEach(t => { expenseByCategory[t.category] = (expenseByCategory[t.category] ?? 0) + t.amount; });
  const categoryLines = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  return `PORTFÓLIO DE CRIPTO:
${formatAssets(assets, prices)}
Total investido: R$ ${brl(totalInvested)} · Valor atual: R$ ${brl(totalCurrent)} · P&L: R$ ${brl(pnl)}

TRANSAÇÕES:
${formatTransactions(transactions)}
Receita: R$ ${brl(income)} · Despesas: R$ ${brl(expense)} · Taxa de poupança: ${savingsRate.toFixed(1)}%

GASTOS POR CATEGORIA:
${categoryLines.length > 0 ? categoryLines.map(([cat, val]) => `- ${cat}: R$ ${brl(val)}`).join('\n') : 'Nenhum gasto registrado.'}`;
}

// Monta o prompt do modo "3 insights fixos" — mesma lógica condicional de
// seções do DeterministicInsightsProvider: só pede diversificação/volatilidade
// se houver ativos, só pede gastos se houver transações. Preserva a ordem que
// o front usa pra casar o quick action clicado com a posição da resposta no
// array (ver insights.service.ts no frontend).
export function buildInsightsPrompt(input: InsightsInput): string {
  const { assets, transactions } = input;
  const sections: string[] = [];
  if (assets.length > 0) sections.push('diversificação da carteira de cripto (aponte concentração excessiva em um único ativo, se houver)');
  if (transactions.length > 0) sections.push('gastos e taxa de poupança do período, com base nas transações');
  if (assets.length > 0) sections.push('alerta de volatilidade: qual ativo teve a maior variação frente ao preço médio pago');

  return `Você é o assistente financeiro do Velt, um app de gestão financeira pessoal e carteira de criptomoedas.

Analise os dados do usuário abaixo e gere exatamente ${sections.length} insight(s), NESTA ORDEM EXATA:
${sections.map((s, i) => `${i + 1}) ${s}`).join('\n')}

${buildFinancialContext(input)}

Responda em português, tom profissional e direto (sem emoji, sem gírias), com números concretos extraídos dos dados acima. Cada insight deve ter um "title" curto (2-4 palavras) e um "body" com 1-2 frases.`;
}

function formatAssets(assets: Asset[], prices: Record<string, number>): string {
  if (assets.length === 0) return 'Nenhum ativo cadastrado.';
  return assets.map(a => {
    const current = prices[a.symbol] ?? a.avgPrice;
    return `- ${a.coin} (${a.symbol}): ${a.amount} unidades, preço médio R$ ${brl(a.avgPrice)}, preço atual R$ ${brl(current)}`;
  }).join('\n');
}

function formatTransactions(transactions: Transaction[]): string {
  if (transactions.length === 0) return 'Nenhuma transação cadastrada.';
  return transactions.map(t =>
    `- ${t.date} · ${t.type === 'entrada' ? 'Entrada' : 'Saída'} · ${t.category} · R$ ${brl(t.amount)}${t.description ? ` · ${t.description}` : ''}`
  ).join('\n');
}
