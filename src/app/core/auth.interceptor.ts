import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../service/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 🔥 NÃO ADICIONA TOKEN EM ROTAS PÚBLICAS
  // /user/escolher-loja usa o token TEMP passado explicitamente por AuthService.escolherLoja,
  // não o token de sessão normal — por isso também entra aqui, pra não ser sobrescrito.
  const isPublicRoute = req.url.includes('/productsPublico') ||
                        req.url.includes('/user/login') ||
                        req.url.includes('/user/CriarConta') ||
                        req.url.includes('/user/escolher-loja') ||
                        req.url.includes('/auth/register');

  if (isPublicRoute) {
    return next(req); // 👈 SAI SEM ADICIONAR TOKEN
  }

  // 🔒 ADICIONA TOKEN APENAS EM ROTAS PRIVADAS
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 || err.status === 403) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};