import { inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { PermissionGroups } from '../security/permission-groups';

export const adminGuard = (
  route: ActivatedRouteSnapshot
) => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const permissoes = route.data?.['permissions'] ?? PermissionGroups.gestao;

  if (
    authService.isAuthenticated() &&
    authService.hasAnyPermission(permissoes)
  ) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
