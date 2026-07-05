import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ChatMessage, InsightMessage } from '../models';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private http = inject(HttpClient);

  private _messages = signal<ChatMessage[]>([
    { role: 'ai', text: 'Olá! Sou o Velt AI 🤖\n\nEstou conectado aos seus dados financeiros e de criptomoedas — clique em uma das análises abaixo para começar!' }
  ]);
  private _loading = signal<boolean>(false);

  readonly messages = this._messages.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly quickActions = [
    'Analise minha diversificação de carteira',
    'Como estão meus gastos este mês?',
    'Alerta de volatilidade dos meus ativos',
  ];

  // O backend devolve as análises numa ordem fixa (diversificação, gastos,
  // volatilidade). Mapeamos o botão clicado pra posição correspondente, em vez
  // de sempre mostrar as 3 — é o que faz a resposta bater com a pergunta feita.
  async sendMessage(text: string): Promise<void> {
    if (!text.trim() || this._loading()) return;

    this._messages.update(msgs => [...msgs, { role: 'user', text }]);
    this._loading.set(true);

    try {
      const insights = await firstValueFrom(
        this.http.get<InsightMessage[]>(`${API_BASE_URL}/insights`),
      );

      const quickIndex = this.quickActions.indexOf(text);
      const picked = quickIndex >= 0 && insights[quickIndex] ? [insights[quickIndex]] : insights;

      if (picked.length === 0) {
        this._messages.update(msgs => [...msgs, {
          role: 'ai',
          text: 'Ainda não tenho dados suficientes pra analisar — adicione ativos na Carteira e transações em Finanças primeiro.',
        }]);
      } else {
        for (const insight of picked) {
          this._messages.update(msgs => [...msgs, { role: 'ai', text: `${insight.title}\n\n${insight.body}` }]);
        }
      }
    } catch {
      this._messages.update(msgs => [...msgs, {
        role: 'ai',
        text: 'Não consegui gerar a análise agora. Tente novamente em instantes.',
      }]);
    } finally {
      this._loading.set(false);
    }
  }
}
