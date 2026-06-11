import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { PermissionService } from './permission.service';
import { AuthService } from '../service/auth.service';

/**
 * Guard de rota que verifica permissões
 * 
 * Uso nas rotas:
 * {
 *   path: 'products',
 *   component: ProductComponent,
 *   canActivate: [PermissionGuard],
 *   data: { permissions: ['PRODUCT_READ'], mode: 'all' }
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    private permissionService: PermissionService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verifica se está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Se a rota não exigir permissões específicas, permite
    if (!route.data || !route.data['permissions']) {
      return true;
    }

    const permissions: string[] = route.data['permissions'];
    const mode: 'all' | 'any' = route.data['mode'] || 'all';

    // Verifica as permissões
    const hasPermission = mode === 'all'
      ? this.permissionService.hasAllPermissions(permissions)
      : this.permissionService.hasAnyPermission(permissions);

    if (!hasPermission) {
      console.warn(
        `Acesso negado. Permissões necessárias: ${permissions.join(', ')}`
      );
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
