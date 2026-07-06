import axios from 'axios';
import { AiProvider, ChatCapableProvider, DeterministicInsightsProvider, InsightMessage, InsightsInput } from './InsightsService';
import { buildFinancialContext, buildInsightsPrompt } from './insightsPrompt';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Provider de IA generativa via Groq — API compatível com o formato de Chat
 * Completions da OpenAI (só muda endpoint, chave e modelos disponíveis).
 * Implementa as mesmas portas AiProvider e ChatCapableProvider que o
 * Gemini/OpenAI — troca de implementação sem mexer em use case, controller
 * ou no resto do container.
 *
 * Mesmo comportamento de resiliência dos outros providers: qualquer falha em
 * analyze() cai pro determinístico; chat() (sem equivalente determinístico,
 * a pergunta é livre) devolve uma mensagem amigável explicando o que houve.
 */
export class GroqInsightsProvider implements AiProvider, ChatCapableProvider {
  private readonly fallback = new DeterministicInsightsProvider();

  constructor(
    private readonly apiKey: string,
    private readonly model = 'llama-3.3-70b-versatile',
  ) {}

  async analyze(input: InsightsInput): Promise<InsightMessage[]> {
    const { assets, transactions } = input;
    if (assets.length === 0 && transactions.length === 0) {
      return this.fallback.analyze(input); // nada pra analisar — não vale gastar uma chamada de IA nisso
    }

    try {
      const text = await this.chatCompletion(
        [
          { role: 'system', content: 'Você é o assistente financeiro do Velt. Responda sempre em JSON válido.' },
          {
            role: 'user',
            content: `${buildInsightsPrompt(input)}\n\nResponda em JSON no formato: {"insights": [{"title": "string curta", "body": "1-2 frases"}, ...]}`,
          },
        ],
        true,
      );

      const parsed = JSON.parse(text);
      const insights = Array.isArray(parsed) ? parsed : parsed.insights;
      if (!Array.isArray(insights) || insights.length === 0) throw new Error('Formato de resposta inesperado.');

      return insights.map((m: { title?: unknown; body?: unknown }) => ({
        title: String(m.title ?? 'Análise'),
        body: String(m.body ?? ''),
      }));
    } catch (err) {
      console.error('[GroqInsightsProvider] falha ao gerar análise, usando fallback determinístico:', err);
      return this.fallback.analyze(input);
    }
  }

  async chat(question: string, input: InsightsInput): Promise<string> {
    try {
      const text = await this.chatCompletion(
        [
          {
            role: 'system',
            content:
              'Você é o assistente financeiro do Velt, um app de gestão financeira pessoal e carteira de criptomoedas. Responda em português, de forma direta e profissional (sem emoji, sem gírias), com base nos dados reais do usuário. Se a pergunta não tiver relação com finanças ou cripto, redirecione educadamente para o escopo do app.',
          },
          { role: 'user', content: `${buildFinancialContext(input)}\n\nPergunta do usuário: ${question}` },
        ],
        false,
      );

      return text.trim();
    } catch (err) {
      return this.friendlyErrorMessage(err);
    }
  }

  private async chatCompletion(messages: { role: string; content: string }[], jsonMode: boolean): Promise<string> {
    const { data } = await axios.post(
      GROQ_URL,
      {
        model: this.model,
        temperature: 0.4,
        messages,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      },
      { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: 15000 },
    );

    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Resposta vazia da Groq.');
    return text;
  }

  private friendlyErrorMessage(err: unknown): string {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;

    if (status === 429) {
      return 'Estou recebendo muitas perguntas agora e atingi o limite de uso da IA. Tente novamente em alguns instantes.';
    }
    if (status === 401 || status === 403) {
      return 'A chave de API da Groq configurada no servidor é inválida ou expirou. Verifique a configuração de GROQ_API_KEY.';
    }

    console.error('[GroqInsightsProvider] falha no chat:', err);
    return 'Não consegui processar sua pergunta agora. Tente novamente em instantes.';
  }
}
