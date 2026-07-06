import { randomUUID } from 'crypto';
import { Asset } from '../../domain/entities';
import { AssetRepository } from '../../domain/repositories';

// Implementação em memória do AssetRepository: usada nos testes de use case,
// sem precisar subir Firestore nem mockar chamadas de rede.
export class InMemoryAssetRepository implements AssetRepository {
  private assets: Asset[] = [];

  async findAllByUser(userId: string): Promise<Asset[]> {
    return this.assets.filter(a => a.userId === userId);
  }

  async findById(id: string): Promise<Asset | null> {
    return this.assets.find(a => a.id === id) ?? null;
  }

  async create(data: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset> {
    const asset: Asset = { id: randomUUID(), createdAt: new Date(), ...data };
    this.assets.push(asset);
    return asset;
  }

  async update(id: string, data: Partial<Pick<Asset, 'amount' | 'avgPrice'>>): Promise<Asset> {
    const asset = this.assets.find(a => a.id === id);
    if (!asset) throw new Error('Asset not found');
    Object.assign(asset, data);
    return asset;
  }

  async delete(id: string): Promise<void> {
    this.assets = this.assets.filter(a => a.id !== id);
  }
}
