import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PermissionGroups } from '../core/security/permission-groups';
import { AppPermissions } from '../core/security/app-permissions';

interface JwtPayload {
  sub: string;
  empresaId?: number;
  lojaId?: number;
  permissions?: unknown[];
  authorities?: unknown[];
  roles?: unknown[];
  exp?: number;
}

export interface LojaEscolha {
  id: number;
  nomeLoja: string;
}

interface LoginApiResponse {
  token?: string;
  escolherLoja?: boolean;
  lojas?: LojaEscolha[];
}

export type LoginResult =
  | { requiresLojaSelection: false }
  | { requiresLojaSelection: true; lojas: LojaEscolha[] };

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API = environment.apiUrl;
  readonly PERMISSIONS = {
    PRODUTO: PermissionGroups.produtos,
    ESTOQUE: PermissionGroups.estoque,
    PEDIDO: PermissionGroups.pedidos,
    USUARIO: PermissionGroups.usuarios,
    LOJA: PermissionGroups.lojas,
    GESTAO: PermissionGroups.gestao,
  } as const;



  constructor(private http: HttpClient) {}

  login(login: string, password: string) {
    return this.http
      .post<LoginApiResponse>(
        `${this.API}/user/login`,
        { login, password }
      )
      .pipe(
        map((res): LoginResult => {
          if (res.token) {
            sessionStorage.setItem('token', res.token);
            return { requiresLojaSelection: false };
          }

          return { requiresLojaSelection: true, lojas: res.lojas ?? [] };
        })
      );
  }

  escolherLoja(lojaId: number) {
    return this.http
      .post<{ token: string }>(
        `${this.API}/auth/escolher-loja`,
        { lojaId }
      )
      .pipe(
        tap(res => {
          sessionStorage.setItem('token', res.token);
        })
      );
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  logout() {
    sessionStorage.clear();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const exp = this.getPayload()?.exp;
    if (exp && Date.now() >= exp * 1000) {
      return false;
    }

    return true;
  }

  private getPayload(): JwtPayload | null {
    const token = this.getToken();

    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        normalizedPayload.length + (4 - normalizedPayload.length % 4) % 4,
        '='
      );

      return JSON.parse(atob(paddedPayload));
    } catch {
      return null;
    }
  }

  getUserName(): string | null {
    return this.getPayload()?.sub ?? null;
  }

  getEmpresaId(): number | null {
    return this.getPayload()?.empresaId ?? null;
  }

  getLojaId(): number | null {
    return this.getPayload()?.lojaId ?? null;
  }

  getPermissions(): string[] {
    const payload = this.getPayload();

    if (!payload) {
      return [];
    }

    return [
      ...this.normalizarPermissoes(payload.permissions),
      ...this.normalizarPermissoes(payload.authorities),
      ...this.normalizarPermissoes(payload.roles),
    ];
  }


  isSuperAdmin(): boolean {
    return this.hasPermission('SUPER_ADMIN');
  }

  hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    return this.isSuperAdmin() || permissions.some(permission =>
      this.hasPermission(permission)
    );
  }

  hasEstoquePermission(): boolean {
    return this.hasAnyPermission(PermissionGroups.estoque);
  }

  getHomeRoute(): string {
    if (
      this.hasPermission(AppPermissions.Pedido.create) &&
      !this.hasPermission(AppPermissions.Produto.read)
    ) {
      return '/fazer-pedido';
    }

    if (this.hasPermission(AppPermissions.Produto.read)) {
      return '/products';
    }

    return '/';
  }



  private normalizarPermissoes(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (typeof value === 'string') {
      return [value];
    }

    if (Array.isArray(value)) {
      return value.flatMap(item => this.normalizarPermissoes(item));
    }

    if (typeof value === 'object') {
      const permission = value as {
        nome?: unknown;
        name?: unknown;
        authority?: unknown;
        permission?: unknown;
      };

      return [
        permission.nome,
        permission.name,
        permission.authority,
        permission.permission,
      ].filter((item): item is string => typeof item === 'string');
    }

    return [];
  }

};
