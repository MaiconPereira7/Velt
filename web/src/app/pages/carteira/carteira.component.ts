import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CryptoService } from '../../core/services/crypto.service';
import { CryptoAsset } from '../../core/models';
import { BrlPipe, PctPipe } from '../../shared/pipes/format.pipes';

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
  imports: [CommonModule, FormsModule, BrlPipe, PctPipe],
  templateUrl: './carteira.component.html',
  styleUrls: ['./carteira.component.scss'],
})
export class CarteiraComponent implements OnInit {
  crypto = inject(CryptoService);

  showForm = signal(false);
  formError = signal('');

  coinPresets = COIN_PRESETS;
  selectedPreset = COIN_PRESETS[0].symbol;
  customCoin = false;

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

  async addAsset(): Promise<void> {
    if (!this.form.coin || !this.form.amount || !this.form.avgPrice) return;
    this.formError.set('');
    try {
      await this.crypto.addAsset({ ...this.form });
      this.showForm.set(false);
      this.form = { coin: '', symbol: '', amount: 0, avgPrice: 0, icon: '◎', color: '#ffffff' };
      this.customCoin = false;
      this.selectedPreset = COIN_PRESETS[0].symbol;
      this.applyPreset(this.selectedPreset);
    } catch {
      this.formError.set('Não foi possível salvar o ativo. Tente novamente.');
    }
  }

  async removeAsset(id: string): Promise<void> {
    if (!confirm('Remover este ativo?')) return;
    try {
      await this.crypto.removeAsset(id);
    } catch {
      this.formError.set('Não foi possível remover o ativo. Tente novamente.');
    }
  }
}
