import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 🔐 SE JÁ ESTIVER LOGADO → MANDA PRA ROTA INICIAL DO PERFIL
  if (auth.isAuthenticated()) {
    router.navigate([auth.getHomeRoute()]);
    return false;
  }

  // 🌍 NÃO LOGADO → PODE ENTRAR
  return true;
};
