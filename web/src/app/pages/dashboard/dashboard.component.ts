import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoService } from '../../core/services/crypto.service';
import { FinanceService } from '../../core/services/finance.service';
import { CryptoAsset } from '../../core/models';
import { BrlPipe, PctPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BrlPipe, PctPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  crypto = inject(CryptoService);
  finance = inject(FinanceService);

  pricePulse = false;
  private priceInterval: any;
  private lastPrice = 0;

  readonly monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  ngOnInit(): void {
    this.crypto.loadAssets();
    this.finance.loadTransactions();
    this.crypto.fetchBtcPrice();
    this.priceInterval = setInterval(() => {
      const prev = this.lastPrice;
      this.crypto.fetchBtcPrice();
      if (prev !== this.crypto.btcPrice()) {
        this.pricePulse = true;
        setTimeout(() => (this.pricePulse = false), 600);
        this.lastPrice = this.crypto.btcPrice();
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    clearInterval(this.priceInterval);
  }

  // Métrica de destaque do dashboard: patrimônio cripto + saldo em conta,
  // não só a carteira de cripto isolada — é o número que responde
  // "quanto eu tenho no total", que é a pergunta que mais importa aqui.
  get netWorth(): number { return this.crypto.totalCurrent + this.finance.balance(); }

  get pnl(): number { return this.crypto.totalCurrent - this.crypto.totalInvested; }
  get pnlPct(): number { return this.crypto.totalInvested > 0 ? (this.pnl / this.crypto.totalInvested) * 100 : 0; }

  // Percentual que um ativo representa do valor atual total da carteira —
  // mesma lógica usada na página Carteira, aqui alimenta a barra de distribuição do dashboard.
  assetPct(asset: CryptoAsset): number {
    return this.crypto.totalCurrent > 0
      ? (asset.amount * asset.currentPrice / this.crypto.totalCurrent) * 100
      : 0;
  }

  // 5 transações mais recentes para o card do dashboard
  get recentTransactions() { return this.finance.transactions().slice(0, 5); }
}
