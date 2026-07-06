// Mapa símbolo -> id da CoinGecko. Mesma lista usada no backend (PriceService)
// e nos presets de moeda do formulário da Carteira — mantida em sincronia de propósito.
export const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  USDT: 'tether',
};
