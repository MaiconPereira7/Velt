import { Pipe, PipeTransform } from '@angular/core';

// Pipe customizado para formatar valores em R$ no padrão brasileiro
// Uso no template: {{ valor | brl }}
@Pipe({ name: 'brl', standalone: true })
export class BrlPipe implements PipeTransform {
  transform(value: number, decimals: number = 2): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}

// Pipe para formatar BTC com 8 casas decimais
@Pipe({ name: 'btc', standalone: true })
export class BtcPipe implements PipeTransform {
  transform(value: number): string {
    return value.toFixed(8);
  }
}

// Pipe para P&L com sinal
@Pipe({ name: 'pct', standalone: true })
export class PctPipe implements PipeTransform {
  transform(value: number): string {
    return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
  }
}
