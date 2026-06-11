import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PermissionGroups } from '../core/security/permission-groups';

interface JwtPayload {
  sub: string;
  role?: string;
  permissions?: string[];
  authorities?: string[];
  roles?: string[];
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API = environment.apiUrl;
  readonly PERMISSIONS = {
    PRODUTO: PermissionGroups.produtos,
    PEDIDO: PermissionGroups.pedidos,
    USUARIO: PermissionGroups.usuarios,
    LOJA: PermissionGroups.lojas,
    GESTAO: PermissionGroups.gestao,
  } as const;

  

  constructor(private http: HttpClient) {}

  login(login: string, password: string) {
    return this.http
      .post<{ token: string }>(
        `${this.API}/user/login`,
        { login, password }
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
    return !!this.getToken();
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

  getRole(): string | null {
    return this.getPayload()?.role ?? null;
  }

  getPermissions(): string[] {
    const payload = this.getPayload();

    return [
      ...(payload?.permissions ?? []),
      ...(payload?.authorities ?? []),
      ...(payload?.roles ?? []),
    ];
  }


  isSuperAdmin(): boolean {
    return this.getRole() === 'SUPER_ADMIN';
  }

  hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    return this.isSuperAdmin() || permissions.some(permission =>
      this.hasPermission(permission)
    );
  }



};
