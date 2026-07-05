import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { Transaction } from '../../core/models';
import { BrlPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-financas',
  standalone: true,
  imports: [CommonModule, FormsModule, BrlPipe],
  templateUrl: './financas.component.html',
  styleUrls: ['./financas.component.scss'],
})
export class FinancasComponent implements OnInit {
  finance = inject(FinanceService);

  showForm = signal(false);
  formError = signal('');
  filter = signal<'todas' | 'entrada' | 'saida'>('todas');

  form: Omit<Transaction, 'id'> = {
    type: 'entrada', category: '', description: '', amount: 0,
    date: new Date().toISOString().slice(0, 10),
  };

  ngOnInit(): void {
    this.finance.loadTransactions();
  }

  get filtered() {
    const f = this.filter();
    return this.finance.transactions().filter(t => f === 'todas' || t.type === f);
  }

  async addTransaction(): Promise<void> {
    if (!this.form.description || !this.form.amount) return;
    this.formError.set('');
    try {
      await this.finance.addTransaction({ ...this.form });
      this.showForm.set(false);
      this.form = { type: 'entrada', category: '', description: '', amount: 0, date: new Date().toISOString().slice(0, 10) };
    } catch {
      this.formError.set('Não foi possível salvar a transação. Tente novamente.');
    }
  }

  async removeTransaction(id: string): Promise<void> {
    if (!confirm('Remover esta transação?')) return;
    try {
      await this.finance.removeTransaction(id);
    } catch {
      this.formError.set('Não foi possível remover a transação. Tente novamente.');
    }
  }

  setFilter(f: 'todas' | 'entrada' | 'saida'): void {
    this.filter.set(f);
  }

  catBarPct(val: number): number {
    return this.finance.totalExpense() > 0 ? (val / this.finance.totalExpense()) * 100 : 0;
  }
}
