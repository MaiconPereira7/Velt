import { db } from './config/firebase';
import { FirestoreUserRepository } from './infra/firestore/FirestoreUserRepository';
import { FirestoreAssetRepository } from './infra/firestore/FirestoreAssetRepository';
import { FirestoreTransactionRepository } from './infra/firestore/FirestoreTransactionRepository';
import { PriceService } from './services/PriceService';
import { InsightsService, DeterministicInsightsProvider, AiProvider, ChatCapableProvider } from './services/InsightsService';
import { GeminiInsightsProvider } from './services/GeminiInsightsProvider';
import { OpenAIInsightsProvider } from './services/OpenAIInsightsProvider';
import { GroqInsightsProvider } from './services/GroqInsightsProvider';
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
import { ChatInsightsUseCase } from './useCases/insights/ChatInsightsUseCase';

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

// Prioridade pro modo "3 insights fixos" (analyze): Groq > OpenAI > Gemini >
// determinístico (sem custo, sem dependência externa) — só usa a primeira
// chave que estiver preenchida no .env, troca de implementação sem mudar
// nenhum use case ou controller.
//
// O chat de perguntas livres depende da porta ChatCapableProvider (Groq e
// Gemini implementam, OpenAI ainda não) — guardamos as instâncias que
// suportam chat separadas, e o container.chatInsights usa a primeira
// disponível (Groq > Gemini), independente de qual provider está ativo pro
// analyze().
const groqApiKey = process.env['GROQ_API_KEY'];
const openaiApiKey = process.env['OPENAI_API_KEY'];
const geminiApiKey = process.env['GEMINI_API_KEY'];

const groqProvider = groqApiKey ? new GroqInsightsProvider(groqApiKey, process.env['GROQ_MODEL']) : null;
const geminiProvider = geminiApiKey ? new GeminiInsightsProvider(geminiApiKey, process.env['GEMINI_MODEL']) : null;

const aiProvider: AiProvider =
  groqProvider ??
  (openaiApiKey ? new OpenAIInsightsProvider(openaiApiKey, process.env['OPENAI_MODEL']) : null) ??
  geminiProvider ??
  new DeterministicInsightsProvider();
const insightsService = new InsightsService(aiProvider);

const chatProvider: ChatCapableProvider | null = groqProvider ?? geminiProvider;

const activeAnalyzeMode = groqApiKey ? 'Groq' : openaiApiKey ? 'OpenAI' : geminiApiKey ? 'Gemini' : 'Determinístico';
console.log(`[Insights] Provider de análise ativo: ${activeAnalyzeMode}`);
console.log(`[Insights] Chat com IA: ${chatProvider ? `disponível (${groqProvider ? 'Groq' : 'Gemini'})` : 'indisponível (defina GROQ_API_KEY ou GEMINI_API_KEY para habilitar)'}`);

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
  chatInsights: chatProvider
    ? new ChatInsightsUseCase(assetRepository, transactionRepository, priceService, chatProvider)
    : undefined,
};
