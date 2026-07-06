import axios from 'axios';
import { AiProvider, ChatCapableProvider, DeterministicInsightsProvider, InsightMessage, InsightsInput } from './InsightsService';
import { buildFinancialContext, buildInsightsPrompt } from './insightsPrompt';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Provider de IA generativa de verdade: monta um prompt com os dados
 * financeiros e de cripto do usuário e pede pro Gemini gerar as análises.
 * Implementa a mesma porta AiProvider que o DeterministicInsightsProvider —
 * o InsightsService e o GetInsightsUseCase não sabem qual dos dois está ativo.
 *
 * Também expõe chat() pra perguntas livres (fora da porta AiProvider — é uma
 * capacidade específica de IA generativa, sem equivalente determinístico).
 *
 * Se a chamada de analyze() falhar (rede fora do ar, cota estourada, resposta
 * mal-formada), cai pro provider determinístico em vez de quebrar a tela do
 * usuário — nunca fica pior do que a experiência que já existia antes do
 * Gemini entrar. O chat() não tem um "determinístico" equivalente (pergunta é
 * livre), então devolve uma mensagem amigável explicando o que aconteceu.
 */
export class GeminiInsightsProvider implements AiProvider, ChatCapableProvider {
  private readonly fallback = new DeterministicInsightsProvider();

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gemini-2.0-flash',
  ) {}

  async analyze(input: InsightsInput): Promise<InsightMessage[]> {
    const { assets, transactions } = input;
    if (assets.length === 0 && transactions.length === 0) {
      return this.fallback.analyze(input); // nada pra analisar — não vale gastar uma chamada de IA nisso
    }

    try {
      const text = await this.generateContent(buildInsightsPrompt(input), {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            body: { type: 'STRING' },
          },
          required: ['title', 'body'],
        },
      });

      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Formato de resposta inesperado.');

      return parsed.map((m: { title?: unknown; body?: unknown }) => ({
        title: String(m.title ?? 'Análise'),
        body: String(m.body ?? ''),
      }));
    } catch (err) {
      console.error('[GeminiInsightsProvider] falha ao gerar análise, usando fallback determinístico:', err);
      return this.fallback.analyze(input);
    }
  }

  // Pergunta livre do usuário sobre seus próprios dados financeiros/cripto.
  // Sem schema de resposta estruturada aqui — a resposta é texto corrido,
  // igual um chat normal.
  async chat(question: string, input: InsightsInput): Promise<string> {
    const prompt = `Você é o assistente financeiro do Velt, um app de gestão financeira pessoal e carteira de criptomoedas. Responda em português, de forma direta e profissional (sem emoji, sem gírias), com base nos dados reais do usuário abaixo. Se a pergunta não tiver relação com finanças ou cripto, redirecione educadamente para o escopo do app.

${buildFinancialContext(input)}

Pergunta do usuário: ${question}`;

    try {
      const text = await this.generateContent(prompt);
      return text.trim();
    } catch (err) {
      return this.friendlyErrorMessage(err);
    }
  }

  private async generateContent(prompt: string, responseSchema?: object): Promise<string> {
    const { data } = await axios.post(
      `${GEMINI_BASE_URL}/${this.model}:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          ...(responseSchema ? { responseMimeType: 'application/json', responseSchema } : {}),
        },
      },
      { params: { key: this.apiKey }, timeout: 15000 },
    );

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Resposta vazia do Gemini.');
    return text;
  }

  private friendlyErrorMessage(err: unknown): string {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;

    if (status === 429) {
      return 'Estou recebendo muitas perguntas agora e atingi o limite de uso da IA. Tente novamente em alguns instantes.';
    }
    if (status === 403 || status === 401) {
      return 'A chave de API do Gemini configurada no servidor é inválida, expirou ou não tem permissão para essa operação. Verifique a configuração de GEMINI_API_KEY.';
    }

    console.error('[GeminiInsightsProvider] falha no chat:', err);
    return 'Não consegui processar sua pergunta agora. Tente novamente em instantes.';
  }
}
