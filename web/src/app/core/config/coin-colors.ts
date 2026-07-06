// Cor de exibição por símbolo — usada na barra e legenda de distribuição da
// carteira. Ativos cadastrados via autocomplete (Passo 3) não têm uma cor de
// marca definida no formulário, então sem isso qualquer moeda "nova" cairia
// no mesmo cinza neutro e ficaria indistinguível das outras na barra.
export const COIN_COLORS: Record<string, string> = {
  BTC: '#f7931a',
  ETH: '#627eea',
  ADA: '#0033ad',
  SOL: '#9945ff',
  BNB: '#f3ba2f',
  XRP: '#00aae4',
  DOT: '#e6007a',
  DOGE: '#c3a634',
  default: '#6b7280',
};

export function coinColor(symbol: string): string {
  return COIN_COLORS[symbol.toUpperCase()] ?? COIN_COLORS['default']!;
}
