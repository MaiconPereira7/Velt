import axios from 'axios';
import { AiProvider, DeterministicInsightsProvider, InsightMessage, InsightsInput } from './InsightsService';
import { buildInsightsPrompt } from './insightsPrompt';

/**
 * Provider de IA generativa via OpenAI (Chat Completions). Implementa a
 * mesma porta AiProvider que o Deterministic/Gemini — troca de implementação
 * sem mexer em use case, controller ou no resto do container.
 *
 * Mesmo comportamento de resiliência do GeminiInsightsProvider: qualquer
 * falha (rede, cota, resposta mal-formada) cai pro provider determinístico
 * em vez de quebrar a tela do usuário.
 */
export class OpenAIInsightsProvider implements AiProvider {
  private readonly fallback = new DeterministicInsightsProvider();

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o-mini',
  ) {}

  async analyze(input: InsightsInput): Promise<InsightMessage[]> {
    const { assets, transactions } = input;
    if (assets.length === 0 && transactions.length === 0) {
      return this.fallback.analyze(input); // nada pra analisar — não vale gastar uma chamada de IA nisso
    }

    try {
      const { data } = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'Você é o assistente financeiro do Velt, um app de gestão financeira pessoal e carteira de criptomoedas. Responda sempre em JSON válido.',
            },
            {
              role: 'user',
              content: `${buildInsightsPrompt(input)}\n\nResponda em JSON no formato: {"insights": [{"title": "string curta", "body": "1-2 frases"}, ...]}`,
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 15000,
        },
      );

      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('Resposta vazia da OpenAI.');

      const parsed = JSON.parse(text);
      const insights = Array.isArray(parsed) ? parsed : parsed.insights;
      if (!Array.isArray(insights) || insights.length === 0) throw new Error('Formato de resposta inesperado.');

      return insights.map((m: { title?: unknown; body?: unknown }) => ({
        title: String(m.title ?? 'Análise'),
        body: String(m.body ?? ''),
      }));
    } catch (err) {
      console.error('[OpenAIInsightsProvider] falha ao gerar análise, usando fallback determinístico:', err);
      return this.fallback.analyze(input);
    }
  }
}
