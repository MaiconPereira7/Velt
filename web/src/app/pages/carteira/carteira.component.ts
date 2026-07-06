import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CryptoService } from '../../core/services/crypto.service';
import { CoinSearchResult, CryptoAsset } from '../../core/models';
import { BrlPipe, PctPipe } from '../../shared/pipes/format.pipes';
import { PriceChartComponent } from '../../shared/components/price-chart/price-chart.component';
import { COINGECKO_IDS } from '../../core/config/coingecko';
import { coinColor } from '../../core/config/coin-colors';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

const COIN_PRESETS: { coin: string; symbol: string; icon: string; color: string }[] = [
  { coin: 'Bitcoin', symbol: 'BTC', icon: '₿', color: '#f7931a' },
  { coin: 'Ethereum', symbol: 'ETH', icon: 'Ξ', color: '#627eea' },
  { coin: 'Solana', symbol: 'SOL', icon: '◎', color: '#14f195' },
  { coin: 'BNB', symbol: 'BNB', icon: 'B', color: '#f3ba2f' },
  { coin: 'XRP', symbol: 'XRP', icon: 'X', color: '#00aae4' },
  { coin: 'Cardano', symbol: 'ADA', icon: 'A', color: '#0033ad' },
  { coin: 'Dogecoin', symbol: 'DOGE', icon: 'Ð', color: '#c2a633' },
  { coin: 'Tether', symbol: 'USDT', icon: '₮', color: '#26a17b' },
];

@Component({
  selector: 'app-carteira',
  standalone: true,
  imports: [CommonModule, FormsModule, BrlPipe, PctPipe, PriceChartComponent, SkeletonLoaderComponent, EmptyStateComponent],
  templateUrl: './carteira.component.html',
  styleUrls: ['./carteira.component.scss'],
})
export class CarteiraComponent implements OnInit {
  crypto = inject(CryptoService);

  showForm = signal(false);
  formError = signal('');

  // Ativo selecionado na tabela — clicar de novo no mesmo ativo fecha o painel do gráfico.
  selectedAssetId = signal<string | null>(null);

  // Id do ativo em edição. Quando preenchido, o formulário vira "Editar Ativo":
  // a moeda fica travada (o PUT só aceita amount/avgPrice) e só quantidade/preço
  // médio ficam editáveis.
  editingId = signal<string | null>(null);

  coinPresets = COIN_PRESETS;
  selectedPreset = COIN_PRESETS[0].symbol;
  customCoin = false;

  // Autocomplete de busca (CoinGecko), usado quando "Outra (personalizada)" é
  // escolhida no lugar dos antigos inputs manuais de Nome/Símbolo.
  searchQuery = signal('');
  searchResults = signal<CoinSearchResult[]>([]);
  searching = signal(false);
  showDropdown = signal(false);
  private searchTimer?: ReturnType<typeof setTimeout>;

  // currentPrice não é mais preenchido no formulário: o backend calcula a
  // cotação ao vivo (CoinGecko + cache) no momento da leitura.
  form: Omit<CryptoAsset, 'id' | 'currentPrice'> = {
    coin: '', symbol: '', amount: 0, avgPrice: 0, icon: '◎', color: '#ffffff',
  };

  ngOnInit(): void {
    this.crypto.loadAssets();
    this.applyPreset(this.selectedPreset);
  }

  onPresetChange(value: string): void {
    if (value === 'custom') {
      this.customCoin = true;
      this.form.coin = '';
      this.form.symbol = '';
      this.form.icon = '?';
      this.form.color = '#8b8fa8';
      this.form.coinId = undefined;
      this.searchQuery.set('');
      this.searchResults.set([]);
      return;
    }
    this.customCoin = false;
    this.applyPreset(value);
  }

  private applyPreset(symbol: string): void {
    const preset = COIN_PRESETS.find(p => p.symbol === symbol);
    if (!preset) return;
    this.form.coin = preset.coin;
    this.form.symbol = preset.symbol;
    this.form.icon = preset.icon;
    this.form.color = preset.color;
    this.form.coinId = COINGECKO_IDS[preset.symbol];
  }

  // Debounce de 300ms: só busca na CoinGecko depois que o usuário para de digitar.
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.form.coin = '';
    this.form.symbol = '';
    this.form.coinId = undefined;
    clearTimeout(this.searchTimer);

    if (!value.trim()) {
      this.searchResults.set([]);
      this.showDropdown.set(false);
      return;
    }
    this.searchTimer = setTimeout(() => this.runSearch(value), 300);
  }

  private async runSearch(query: string): Promise<void> {
    this.searching.set(true);
    try {
      this.searchResults.set(await this.crypto.searchCoins(query));
    } catch {
      this.searchResults.set([]);
    } finally {
      this.searching.set(false);
      this.showDropdown.set(true);
    }
  }

  selectCoin(result: CoinSearchResult): void {
    this.form.coin = result.name;
    this.form.symbol = result.symbol.toUpperCase();
    this.form.icon = result.thumb;
    this.form.color = '#8b8fa8';
    this.form.coinId = result.id;
    this.searchQuery.set(`${result.name} (${result.symbol.toUpperCase()})`);
    this.showDropdown.set(false);
    this.searchResults.set([]);
  }

  // Delay pra deixar o (click) do dropdown disparar antes do blur escondê-lo.
  onSearchBlur(): void {
    setTimeout(() => this.showDropdown.set(false), 150);
  }

  pnlPct(asset: CryptoAsset): number {
    return ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
  }

  pnlReal(asset: CryptoAsset): number {
    return (asset.amount * asset.currentPrice) - (asset.amount * asset.avgPrice);
  }

  assetPct(asset: CryptoAsset): number {
    return this.crypto.totalCurrent > 0
      ? (asset.amount * asset.currentPrice / this.crypto.totalCurrent) * 100
      : 0;
  }

  toggleAssetChart(asset: CryptoAsset): void {
    this.selectedAssetId.update(id => (id === asset.id ? null : asset.id));
  }

  get selectedAsset(): CryptoAsset | undefined {
    return this.crypto.assets().find(a => a.id === this.selectedAssetId());
  }

  coingeckoId(asset: CryptoAsset): string | undefined {
    return asset.coinId ?? COINGECKO_IDS[asset.symbol];
  }

  isImageIcon(icon: string): boolean {
    return icon.startsWith('http');
  }

  // Cor fixa por símbolo pra distribuição — exposta como propriedade pra poder
  // ser chamada direto no template (métodos importados de módulo não são
  // resolvidos como funções de template do Angular).
  coinColor = coinColor;

  toggleAddForm(): void {
    if (this.showForm()) {
      this.showForm.set(false);
      return;
    }
    this.startAdd();
  }

  startAdd(): void {
    this.editingId.set(null);
    this.resetForm();
    this.formError.set('');
    this.showForm.set(true);
  }

  startEdit(asset: CryptoAsset): void {
    this.editingId.set(asset.id);
    this.form = {
      coin: asset.coin, symbol: asset.symbol, coinId: asset.coinId,
      amount: asset.amount, avgPrice: asset.avgPrice, icon: asset.icon, color: asset.color,
    };
    this.formError.set('');
    this.showForm.set(true);
  }

  private resetForm(): void {
    this.customCoin = false;
    this.selectedPreset = COIN_PRESETS[0].symbol;
    this.form = { coin: '', symbol: '', amount: 0, avgPrice: 0, icon: '◎', color: '#ffffff' };
    this.applyPreset(this.selectedPreset);
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  async saveAsset(): Promise<void> {
    this.formError.set('');
    const editId = this.editingId();

    if (editId) {
      if (!this.form.amount || !this.form.avgPrice) return;
      try {
        await this.crypto.updateAsset(editId, { amount: this.form.amount, avgPrice: this.form.avgPrice });
        this.showForm.set(false);
        this.editingId.set(null);
      } catch {
        this.formError.set('Não foi possível salvar as alterações. Tente novamente.');
      }
      return;
    }

    if (!this.form.coin || !this.form.amount || !this.form.avgPrice) return;
    try {
      await this.crypto.addAsset({ ...this.form });
      this.showForm.set(false);
      this.resetForm();
    } catch {
      this.formError.set('Não foi possível salvar o ativo. Tente novamente.');
    }
  }

  async removeAsset(id: string): Promise<void> {
    if (!confirm('Remover este ativo?')) return;
    try {
      await this.crypto.removeAsset(id);
      if (this.selectedAssetId() === id) this.selectedAssetId.set(null);
      if (this.editingId() === id) {
        this.editingId.set(null);
        this.showForm.set(false);
      }
    } catch {
      this.formError.set('Não foi possível remover o ativo. Tente novamente.');
    }
  }
}
