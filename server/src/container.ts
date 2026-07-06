import { db } from './config/firebase';
import { FirestoreUserRepository } from './infra/firestore/FirestoreUserRepository';
import { FirestoreAssetRepository } from './infra/firestore/FirestoreAssetRepository';
import { FirestoreTransactionRepository } from './infra/firestore/FirestoreTransactionRepository';
import { PriceService } from './services/PriceService';
import { InsightsService, DeterministicInsightsProvider } from './services/InsightsService';
import { RegisterUserUseCase } from './useCases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from './useCases/auth/LoginUserUseCase';
import { GetAssetsUseCase } from './useCases/crypto/GetAssetsUseCase';
import { AddAssetUseCase } from './useCases/crypto/AddAssetUseCase';
import { UpdateAssetUseCase } from './useCases/crypto/UpdateAssetUseCase';
import { RemoveAssetUseCase } from './useCases/crypto/RemoveAssetUseCase';
import { GetTransactionsUseCase } from './useCases/finance/GetTransactionsUseCase';
import { AddTransactionUseCase } from './useCases/finance/AddTransactionUseCase';
import { UpdateTransactionUseCase } from './useCases/finance/UpdateTransactionUseCase';
import { RemoveTransactionUseCase } from './useCases/finance/RemoveTransactionUseCase';
import { GetInsightsUseCase } from './useCases/insights/GetInsightsUseCase';

// "Composition root": o único arquivo do projeto que conhece as implementações
// concretas (Firestore, CoinGecko) ao mesmo tempo. Controllers e use cases só
// enxergam interfaces — isso é o que permite, por exemplo, testar um use case
// injetando um repositório fake, sem subir Firestore nem servidor HTTP.
//
// Não usamos um framework de DI (InversifyJS, tsyringe) de propósito: no
// tamanho atual do projeto isso seria complexidade sem retorno. Dá pra
// introduzir um container de DI de verdade depois sem tocar em nenhum use case.
const userRepository = new FirestoreUserRepository(db);
const assetRepository = new FirestoreAssetRepository(db);
const transactionRepository = new FirestoreTransactionRepository(db);

const priceService = new PriceService();
const insightsService = new InsightsService(new DeterministicInsightsProvider());

export const container = {
  priceService,

  registerUser: new RegisterUserUseCase(userRepository),
  loginUser: new LoginUserUseCase(userRepository),

  getAssets: new GetAssetsUseCase(assetRepository, priceService),
  addAsset: new AddAssetUseCase(assetRepository),
  updateAsset: new UpdateAssetUseCase(assetRepository),
  removeAsset: new RemoveAssetUseCase(assetRepository),

  getTransactions: new GetTransactionsUseCase(transactionRepository),
  addTransaction: new AddTransactionUseCase(transactionRepository),
  updateTransaction: new UpdateTransactionUseCase(transactionRepository),
  removeTransaction: new RemoveTransactionUseCase(transactionRepository),

  getInsights: new GetInsightsUseCase(assetRepository, transactionRepository, priceService, insightsService),
};
