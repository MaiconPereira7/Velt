import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CryptoService } from '../../core/services/crypto.service';
import { FinanceService } from '../../core/services/finance.service';
import { BrlPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, BrlPipe],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  private auth = inject(AuthService);
  crypto = inject(CryptoService);
  finance = inject(FinanceService);

  readonly user = this.auth.user;

  ngOnInit(): void {
    this.crypto.loadAssets();
    this.finance.loadTransactions();
  }

  get initials(): string {
    return (this.user()?.name ?? 'U')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('');
  }

  get netWorth(): number {
    return this.crypto.totalCurrent + this.finance.balance();
  }

  logout(): void {
    this.auth.logout();
  }
}
