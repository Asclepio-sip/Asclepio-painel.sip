import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface JwtPayload {
  sub: string;
  role?: string;
  permissions?: string[];
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API = environment.apiUrl;

  

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
      return JSON.parse(atob(token.split('.')[1]));
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
    return this.getPayload()?.permissions ?? [];
  }


  isSuperAdmin(): boolean {
    return this.getRole() === 'SUPER_ADMIN';
  }

  hasPermission(permission: string): boolean {
  return this.getPermissions().includes(permission);
}

hasAnyPermission(permissions: string[]): boolean {
  return permissions.some(permission =>
    this.hasPermission(permission)
  );
}


  readonly PERMISSIONS = {

  PRODUTO: [
    'PRODUCT_READ',
    'PRODUCT_CREATE',
    'PRODUCT_UPDATE',
    'PRODUCT_DELETE',

    'PRODUTO_READ',
    'PRODUTO_CREATE',
    'PRODUTO_UPDATE',
    'PRODUTO_DELETE',
  ],

  ESTOQUE: [
    'ESTOQUE_READ',
    'ESTOQUE_CREATE',
    'ESTOQUE_UPDATE',
    'ESTOQUE_DELETE',
    'ESTOQUE_PROMO',
  ],

  LOJA: [
    'LOJA_READ',
    'LOJA_CREATE',
    'LOJA_UPDATE',
    'LOJA_DELETE',
  ],

  BAIRRO: [
    'BAIRRO_READ',
    'BAIRRO_CREATE',
    'BAIRRO_UPDATE',
    'BAIRRO_DELETE',
  ],

  LOJA_BAIRRO: [
    'LOJA_BAIRRO_READ',
    'LOJA_BAIRRO_CREATE',
    'LOJA_BAIRRO_UPDATE',
    'LOJA_BAIRRO_DELETE',
  ],

  PEDIDO: [
    'PEDIDO_READ',
    'PEDIDO_CREATE',
    'PEDIDO_UPDATE',
    'PEDIDO_DELETE',
  ],

  USUARIO: [
    'USUARIO_READ',
    'USUARIO_CREATE',
    'USUARIO_UPDATE',
    'USUARIO_DELETE',
  ],

  CATEGORIA: [
    'CATEGORIA_READ',
    'CATEGORIA_CREATE',
    'CATEGORIA_UPDATE',
    'CATEGORIA_DELETE',
  ],

  PERMISSIONS: [
    'PERMISSIONS_READ',
  ],

  GESTAO: [
    'USUARIO_READ',
    'USUARIO_CREATE',
    'USUARIO_UPDATE',
    'USUARIO_DELETE',

    'PRODUCT_READ',
    'PRODUCT_CREATE',
    'PRODUCT_UPDATE',
    'PRODUCT_DELETE',

    'PRODUTO_READ',
    'PRODUTO_CREATE',
    'PRODUTO_UPDATE',
    'PRODUTO_DELETE',

    'PEDIDO_READ',
    'PEDIDO_CREATE',
    'PEDIDO_UPDATE',
    'PEDIDO_DELETE',

    'LOJA_READ',
    'LOJA_CREATE',
    'LOJA_UPDATE',
    'LOJA_DELETE',

    'ESTOQUE_READ',
    'ESTOQUE_CREATE',
    'ESTOQUE_UPDATE',
    'ESTOQUE_DELETE',
    'ESTOQUE_PROMO',
  ],
};
}