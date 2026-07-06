import { AssetRepository } from '../../domain/repositories';
import { AppError } from '../../utils/error.middleware';

export interface UpdateAssetInput {
  amount?: number;
  avgPrice?: number;
}

export class UpdateAssetUseCase {
  constructor(private readonly assets: AssetRepository) {}

  async execute(userId: string, assetId: string, input: UpdateAssetInput) {
    const asset = await this.assets.findById(assetId);
    // Mesma checagem de posse do RemoveAssetUseCase — aqui falha com 404 em vez
    // de silenciar, porque quem chama PUT espera o recurso atualizado de volta.
    if (!asset || asset.userId !== userId) {
      throw new AppError(404, 'Ativo não encontrado.');
    }

    if (input.amount === undefined && input.avgPrice === undefined) {
      throw new AppError(400, 'Informe amount e/ou avgPrice para atualizar.');
    }
    if (input.amount !== undefined && input.amount <= 0) {
      throw new AppError(400, 'Amount deve ser positivo.');
    }
    if (input.avgPrice !== undefined && input.avgPrice <= 0) {
      throw new AppError(400, 'AvgPrice deve ser positivo.');
    }

    return this.assets.update(assetId, {
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.avgPrice !== undefined ? { avgPrice: input.avgPrice } : {}),
    });
  }
}
