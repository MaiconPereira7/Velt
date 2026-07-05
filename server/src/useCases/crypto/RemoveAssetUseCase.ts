import { AssetRepository } from '../../domain/repositories';

export class RemoveAssetUseCase {
  constructor(private readonly assets: AssetRepository) {}

  async execute(userId: string, assetId: string): Promise<void> {
    const asset = await this.assets.findById(assetId);
    // Checagem de posse: o Firestore guarda todos os ativos numa coleção global,
    // então sem isso qualquer usuário autenticado poderia apagar o ID de outro
    // usuário só adivinhando/testando IDs. Regra de negócio, por isso mora aqui
    // e não no controller nem no repositório.
    if (!asset || asset.userId !== userId) return;
    await this.assets.delete(assetId);
  }
}
