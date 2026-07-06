import { Component, Input } from '@angular/core';

// Placeholder de carregamento reutilizável — substitui os antigos textos
// vazios/`.skeleton` fixo por um retângulo com pulse configurável em
// tamanho, usado em todas as páginas enquanto os dados carregam.
@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  template: `<div class="skeleton-loader" [style.width]="width" [style.height]="height" [style.border-radius]="borderRadius"></div>`,
  styleUrls: ['./skeleton-loader.component.scss'],
})
export class SkeletonLoaderComponent {
  @Input() width = '70%';
  @Input() height = '52px';
  @Input() borderRadius = '10px';
}
