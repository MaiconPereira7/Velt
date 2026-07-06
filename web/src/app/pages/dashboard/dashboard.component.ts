import { Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoService } from '../../core/services/crypto.service';
import { FinanceService } from '../../core/services/finance.service';
import { CryptoAsset } from '../../core/models';
import { BrlPipe, PctPipe } from '../../shared/pipes/format.pipes';
import { PriceChartComponent } from '../../shared/components/price-chart/price-chart.component';
import { coinColor } from '../../core/config/coin-colors';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BrlPipe, PctPipe, PriceChartComponent, SkeletonLoaderComponent, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  crypto = inject(CryptoService);
  finance = inject(FinanceService);

  private priceInterval: any;

  // Flash verde (subiu) / vermelho (caiu) por 0.5s quando o preço do BTC ou o
  // patrimônio total mudam. Usa effect() pra reagir de verdade ao signal —
  // a versão antiga comparava o preço logo depois de chamar fetchBtcPrice()
  // (uma chamada assíncrona), então quase nunca pegava a mudança de verdade
  // porque o valor novo ainda não tinha chegado no momento da comparação.
  btcFlash: 'up' | 'down' | null = null;
  netWorthFlash: 'up' | 'down' | null = null;
  private lastBtcPrice = 0;
  private lastNetWorth = 0;
  private btcInitialized = false;
  private netWorthInitialized = false;

  readonly monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  constructor() {
    effect(() => {
      const price = this.crypto.btcPrice();
      if (this.btcInitialized && price !== this.lastBtcPrice) {
        this.btcFlash = price > this.lastBtcPrice ? 'up' : 'down';
        setTimeout(() => (this.btcFlash = null), 500);
      }
      this.lastBtcPrice = price;
      this.btcInitialized = true;
    });

    effect(() => {
      const value = this.netWorth;
      if (this.netWorthInitialized && value !== this.lastNetWorth) {
        this.netWorthFlash = value > this.lastNetWorth ? 'up' : 'down';
        setTimeout(() => (this.netWorthFlash = null), 500);
      }
      this.lastNetWorth = value;
      this.netWorthInitialized = true;
    });
  }

  ngOnInit(): void {
    this.crypto.loadAssets();
    this.finance.loadTransactions();
    this.crypto.fetchBtcPrice();
    this.priceInterval = setInterval(() => this.crypto.fetchBtcPrice(), 3000);
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

  // Ativos cadastrados via autocomplete guardam o thumb da CoinGecko (URL) em
  // vez de um glifo de texto — mesmo tratamento usado na Carteira.
  isImageIcon(icon: string): boolean {
    return icon.startsWith('http');
  }

  // Cor fixa por símbolo pra distribuição — mesma lógica da Carteira.
  coinColor = coinColor;

  // 5 transações mais recentes para o card do dashboard
  get recentTransactions() { return this.finance.transactions().slice(0, 5); }
}
