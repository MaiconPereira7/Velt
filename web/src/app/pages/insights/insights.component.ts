import { Component, ElementRef, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsightsService } from '../../core/services/insights.service';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
})
export class InsightsComponent {
  insights = inject(InsightsService);

  @ViewChild('chatBottom') chatBottom!: ElementRef;

  userInput = '';

  constructor() {
    // Rola para o final toda vez que messages muda
    effect(() => {
      this.insights.messages(); // dependência reativa
      setTimeout(() => {
        this.chatBottom?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
  }

  send(text?: string): void {
    const msg = text ?? this.userInput.trim();
    if (!msg) return;
    this.userInput = '';
    this.insights.sendMessage(msg);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  // Renderiza **negrito** no texto da IA
  renderText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
}
