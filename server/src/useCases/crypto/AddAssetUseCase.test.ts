import { describe, it, expect } from 'vitest';
import { AddAssetUseCase } from './AddAssetUseCase';
import { InMemoryAssetRepository } from '../../infra/memory/InMemoryAssetRepository';

describe('AddAssetUseCase', () => {
  it('deve criar um ativo com dados válidos', async () => {
    const assets = new InMemoryAssetRepository();
    const useCase = new AddAssetUseCase(assets);

    const asset = await useCase.execute('user-1', {
      coin: 'Bitcoin', symbol: 'BTC', amount: 0.5, avgPrice: 300000, icon: '₿', color: '#f7931a',
    });

    expect(asset.id).toBeTypeOf('string');
    expect(asset.userId).toBe('user-1');
    expect(asset.symbol).toBe('BTC');
    expect(await assets.findAllByUser('user-1')).toHaveLength(1);
  });
});
