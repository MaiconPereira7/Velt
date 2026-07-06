import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

// Empty state reutilizável: logo do Velt como marca d'água de fundo + texto
// principal/secundário + CTA opcional (botão com (cta) ou link via ctaLink,
// pra cobrir tanto "abrir formulário aqui" quanto "ir pra outra página").
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() ctaLabel = '';
  @Input() ctaLink = '';
  @Output() cta = new EventEmitter<void>();
}
