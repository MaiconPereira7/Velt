import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../config/api.config';

// Interceptor funcional (padrão Angular 15+): anexa o Bearer token em toda
// chamada pro nosso backend, sem cada service precisar lembrar de fazer isso.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('velt_token');
  if (token && req.url.startsWith(API_BASE_URL)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
