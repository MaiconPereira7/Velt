import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { BitcoinPrice, CoinSearchResult, CryptoAsset } from '../models';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private http = inject(HttpClient);

  private _btcPrice = signal<number>(589420);
  private _isLive = signal<boolean>(false);
  private _priceLoading = signal<boolean>(true);

  readonly btcPrice = this._btcPrice.asReadonly();
  readonly isLive = this._isLive.asReadonly();
  readonly priceLoading = this._priceLoading.asReadonly();

  private _assets = signal<CryptoAsset[]>([]);
  private _assetsLoading = signal<boolean>(false);
  private _assetsError = signal<string | null>(null);

  readonly assets = this._assets.asReadonly();
  readonly assetsLoading = this._assetsLoading.asReadonly();
  readonly assetsError = this._assetsError.asReadonly();

  fetchBtcPrice(): void {
    this.http.get<BitcoinPrice>(`${API_BASE_URL}/crypto/bitcoin`).pipe(
      catchError(() => {
        this._btcPrice.update(p => Math.round(p + (Math.random() - 0.48) * 800));
        this._isLive.set(false);
        this._priceLoading.set(false);
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this._btcPrice.set(res.valor);
        this._isLive.set(true);
      }
      this._priceLoading.set(false);
    });
  }

  loadAssets(): void {
    this._assetsLoading.set(true);
    this._assetsError.set(null);
    this.http.get<CryptoAsset[]>(`${API_BASE_URL}/crypto/assets`).pipe(
      catchError(() => {
        this._assetsError.set('Não foi possível carregar seus ativos.');
        this._assets.set([]);
        return of(null);
      })
    ).subscribe(res => {
      if (res) this._assets.set(res);
      this._assetsLoading.set(false);
    });
  }

  // currentPrice não é enviado: o backend calcula a cotação ao vivo (com cache)
  // no momento da leitura, então não faz sentido o cliente "chutar" um valor aqui.
  // Por isso, depois de criar, recarregamos a lista em vez de inserir localmente:
  // a resposta do POST é a entidade "crua" (sem currentPrice), a lista enriquecida
  // só existe no GET.
  async addAsset(asset: Omit<CryptoAsset, 'id' | 'currentPrice'>): Promise<void> {
    await firstValueFrom(this.http.post(`${API_BASE_URL}/crypto/assets`, asset));
    this.loadAssets();
  }

  async updateAsset(id: string, data: { amount?: number; avgPrice?: number }): Promise<void> {
    await firstValueFrom(this.http.put(`${API_BASE_URL}/crypto/assets/${id}`, data));
    this.loadAssets();
  }

  async removeAsset(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${API_BASE_URL}/crypto/assets/${id}`));
    this._assets.update(list => list.filter(a => a.id !== id));
  }

  // Histórico de preço (pra alimentar o price-chart) — cada item é [timestamp, preço].
  getPriceHistory(coinId: string, days: number): Promise<[number, number][]> {
    return firstValueFrom(
      this.http.get<[number, number][]>(`${API_BASE_URL}/crypto/price-history/${coinId}`, { params: { days } }),
    );
  }

  // Autocomplete do formulário "Adicionar Ativo" — busca por nome/símbolo na CoinGecko.
  searchCoins(query: string): Promise<CoinSearchResult[]> {
    return firstValueFrom(
      this.http.get<CoinSearchResult[]>(`${API_BASE_URL}/crypto/search`, { params: { q: query } }),
    );
  }

  get totalInvested(): number {
    return this._assets().reduce((s, a) => s + a.amount * a.avgPrice, 0);
  }

  get totalCurrent(): number {
    return this._assets().reduce((s, a) => s + a.amount * a.currentPrice, 0);
  }
}
