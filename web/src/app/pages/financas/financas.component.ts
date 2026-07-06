import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { Transaction } from '../../core/models';
import { BrlPipe } from '../../shared/pipes/format.pipes';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-financas',
  standalone: true,
  imports: [CommonModule, FormsModule, BrlPipe, SkeletonLoaderComponent, EmptyStateComponent],
  templateUrl: './financas.component.html',
  styleUrls: ['./financas.component.scss'],
})
export class FinancasComponent implements OnInit {
  finance = inject(FinanceService);

  showForm = signal(false);
  formError = signal('');
  filter = signal<'todas' | 'entrada' | 'saida'>('todas');

  readonly monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  readonly categories = [
    'Alimentação', 'Transporte', 'Moradia', 'Lazer',
    'Saúde', 'Educação', 'Salário', 'Freelance',
    'Investimentos', 'Outros',
  ];

  selectedCategory = this.categories[0];
  customCategory = false;

  // Id da transação em edição. O PUT só aceita description/category/amount/date
  // (não dá pra trocar o tipo entrada/saída de uma transação já lançada).
  editingId = signal<string | null>(null);

  form: Omit<Transaction, 'id'> = {
    type: 'entrada', category: this.categories[0], description: '', amount: 0,
    date: new Date().toISOString().slice(0, 10),
  };

  ngOnInit(): void {
    this.finance.loadTransactions();
  }

  get filtered() {
    const f = this.filter();
    return this.finance.transactions().filter(t => f === 'todas' || t.type === f);
  }

  // Mesma lógica do customCoin na Carteira: "Outra" libera um campo de texto livre.
  onCategoryChange(value: string): void {
    if (value === 'custom') {
      this.customCategory = true;
      this.form.category = '';
      return;
    }
    this.customCategory = false;
    this.form.category = value;
  }

  toggleAddForm(): void {
    if (this.showForm()) {
      this.showForm.set(false);
      return;
    }
    this.startAdd();
  }

  startAdd(): void {
    this.editingId.set(null);
    this.customCategory = false;
    this.selectedCategory = this.categories[0];
    this.form = { type: 'entrada', category: this.categories[0], description: '', amount: 0, date: new Date().toISOString().slice(0, 10) };
    this.formError.set('');
    this.showForm.set(true);
  }

  startEdit(tx: Transaction): void {
    this.editingId.set(tx.id);
    this.form = { type: tx.type, category: tx.category, description: tx.description, amount: tx.amount, date: tx.date };
    this.customCategory = !this.categories.includes(tx.category);
    this.selectedCategory = this.customCategory ? 'custom' : tx.category;
    this.formError.set('');
    this.showForm.set(true);
  }

  async saveTransaction(): Promise<void> {
    if (!this.form.description || !this.form.amount) return;
    this.formError.set('');
    const editId = this.editingId();
    try {
      if (editId) {
        await this.finance.updateTransaction(editId, {
          description: this.form.description,
          category: this.form.category,
          amount: this.form.amount,
          date: this.form.date,
        });
      } else {
        await this.finance.addTransaction({ ...this.form });
      }
      this.showForm.set(false);
      this.editingId.set(null);
    } catch {
      this.formError.set(editId ? 'Não foi possível salvar as alterações. Tente novamente.' : 'Não foi possível salvar a transação. Tente novamente.');
    }
  }

  async removeTransaction(id: string): Promise<void> {
    if (!confirm('Remover esta transação?')) return;
    try {
      await this.finance.removeTransaction(id);
      if (this.editingId() === id) {
        this.editingId.set(null);
        this.showForm.set(false);
      }
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
