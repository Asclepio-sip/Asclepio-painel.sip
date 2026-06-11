import { Injectable } from '@angular/core';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(
    private authService: AuthService
  ) {}

  /**
   * Extrai as autoridades do token JWT
   */
  getAuthorities(): string[] {
    const token = this.authService.getToken();

    if (!token) return [];

    try {
      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      // O backend pode retornar em diferentes formatos:
      // authorities, permissions, roles, etc
      return (
        payload.authorities ||
        payload.permissions ||
        payload.roles ||
        []
      );
    } catch {
      return [];
    }
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  hasPermission(permission: string): boolean {
    const authorities = this.getAuthorities();
    return authorities.includes(permission);
  }

  /**
   * Verifica se o usuário tem TODAS as permissões fornecidas
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Verifica se o usuário tem PELO MENOS UMA das permissões fornecidas
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Permissões específicas de Produto
   */
  canReadProducts(): boolean {
    return this.hasPermission('PRODUCT_READ');
  }

  canCreateProduct(): boolean {
    return this.hasPermission('PRODUCT_CREATE');
  }

  canUpdateProduct(): boolean {
    return this.hasPermission('PRODUCT_UPDATE');
  }

  canDeleteProduct(): boolean {
    return this.hasPermission('PRODUCT_DELETE');
  }
}
