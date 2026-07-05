import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, User } from '../models';
import { API_BASE_URL } from '../config/api.config';

const TOKEN_KEY = 'velt_token';
const USER_KEY = 'velt_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Lê o usuário salvo no localStorage na inicialização — é o que faz a sessão
  // sobreviver a um F5, em vez de deslogar toda vez que a página recarrega.
  private _user = signal<User | null>(this.readStoredUser());

  readonly user = this._user.asReadonly();

  async login(email: string, password: string): Promise<User> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password }),
    );
    this.persistSession(res);
    return res.user;
  }

  async register(name: string, email: string, password: string): Promise<User> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, { name, email, password }),
    );
    this.persistSession(res);
    return res.user;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigateByUrl('/login');
  }

  isLoggedIn(): boolean {
    return this._user() !== null;
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  }
}
