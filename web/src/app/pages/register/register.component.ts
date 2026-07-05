import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async onSubmit(): Promise<void> {
    if (!this.name || !this.email || !this.password) {
      this.error.set('Preencha nome, e-mail e senha.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.register(this.name, this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err?.error?.error ?? 'Não foi possível criar sua conta. Tente novamente.');
      this.loading.set(false);
    }
  }
}
