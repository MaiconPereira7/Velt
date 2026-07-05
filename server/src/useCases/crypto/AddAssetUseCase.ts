import { AssetRepository } from '../../domain/repositories';
import { AppError } from '../../utils/error.middleware';

export interface AddAssetInput {
  coin: string;
  symbol: string;
  amount: number;
  avgPrice: number;
  icon: string;
  color: string;
}

export class AddAssetUseCase {
  constructor(private readonly assets: AssetRepository) {}

  async execute(userId: string, input: AddAssetInput) {
    if (!input.coin || !input.symbol || !input.amount || !input.avgPrice) {
      throw new AppError(400, 'Campos obrigatórios: coin, symbol, amount, avgPrice.');
    }
    return this.assets.create({
      userId,
      coin: input.coin,
      symbol: input.symbol,
      amount: input.amount,
      avgPrice: input.avgPrice,
      icon: input.icon || '◎',
      color: input.color || '#8b8fa8',
    });
  }
}
