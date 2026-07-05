import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: SafeHtml;
  badge?: string;
}

const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  carteira: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M16 12.5h3"/><path d="M2.5 9.5h19"/></svg>`,
  financas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/></svg>`,
  insights: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/></svg>`,
  perfil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"/></svg>`,
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  readonly user = this.auth.user;

  // Controla a sidebar em telas mobile — some/aparece via classe `sidebar--open`.
  mobileOpen = signal(false);

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard',   icon: this.trust(ICONS.dashboard) },
    { path: '/carteira',  label: 'Carteira',    icon: this.trust(ICONS.carteira) },
    { path: '/financas',  label: 'Finanças',    icon: this.trust(ICONS.financas) },
    { path: '/insights',  label: 'Insights IA', icon: this.trust(ICONS.insights), badge: 'AI' },
    { path: '/perfil',    label: 'Perfil',      icon: this.trust(ICONS.perfil) },
  ];

  private trust(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  get initials(): string {
    return (this.user()?.name ?? 'U')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('');
  }

  get firstName(): string {
    return this.user()?.name?.split(' ')[0] ?? '';
  }

  toggle(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
