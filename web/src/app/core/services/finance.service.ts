import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { Transaction } from '../models';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);

  private _transactions = signal<Transaction[]>([]);
  private _transactionsLoading = signal<boolean>(false);
  private _transactionsError = signal<string | null>(null);

  readonly transactions = this._transactions.asReadonly();
  readonly transactionsLoading = this._transactionsLoading.asReadonly();
  readonly transactionsError = this._transactionsError.asReadonly();

  readonly totalIncome = computed(() =>
    this._transactions().filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0)
  );

  readonly totalExpense = computed(() =>
    this._transactions().filter(t => t.type === 'saida').reduce((s, t) => s + t.amount, 0)
  );

  readonly balance = computed(() => this.totalIncome() - this.totalExpense());

  readonly savingsRate = computed(() =>
    this.totalIncome() > 0 ? (this.balance() / this.totalIncome()) * 100 : 0
  );

  readonly expenseByCategory = computed(() => {
    const map: Record<string, number> = {};
    this._transactions()
      .filter(t => t.type === 'saida')
      .forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  });

  loadTransactions(): void {
    this._transactionsLoading.set(true);
    this._transactionsError.set(null);
    this.http.get<Transaction[]>(`${API_BASE_URL}/transactions`).pipe(
      catchError(() => {
        this._transactionsError.set('Não foi possível carregar suas transações.');
        this._transactions.set([]);
        return of(null);
      })
    ).subscribe(res => {
      if (res) this._transactions.set(res);
      this._transactionsLoading.set(false);
    });
  }

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
    const created = await firstValueFrom(
      this.http.post<Transaction>(`${API_BASE_URL}/transactions`, tx),
    );
    this._transactions.update(list => [created, ...list]);
  }

  async removeTransaction(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${API_BASE_URL}/transactions/${id}`));
    this._transactions.update(list => list.filter(t => t.id !== id));
  }

  async updateTransaction(id: string, data: Partial<Pick<Transaction, 'description' | 'category' | 'amount' | 'date'>>): Promise<void> {
    const updated = await firstValueFrom(this.http.put<Transaction>(`${API_BASE_URL}/transactions/${id}`, data));
    this._transactions.update(list => list.map(t => (t.id === id ? updated : t)));
  }
}
