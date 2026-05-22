import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // 🔥 NÃO ADICIONA TOKEN EM ROTAS PÚBLICAS
  const isPublicRoute = req.url.includes('/productsPublico') || 
                        req.url.includes('/auth/login') || 
                        req.url.includes('/auth/register');

  if (isPublicRoute) {
    return next(req); // 👈 SAI SEM ADICIONAR TOKEN
  }

  // 🔒 ADICIONA TOKEN APENAS EM ROTAS PRIVADAS
  const token = sessionStorage.getItem('token'); // 👈 USA sessionStorage

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
        sessionStorage.removeItem('token'); // 👈 USA sessionStorage
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};