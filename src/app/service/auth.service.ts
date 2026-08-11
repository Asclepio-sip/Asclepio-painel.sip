import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PermissionGroups } from '../core/security/permission-groups';
import { AppPermissions } from '../core/security/app-permissions';

interface JwtPayload {
  sub: string;
  empresaId?: number;
  lojaId?: number;
  gerente?: boolean;
  nome?: string;
  permissions?: unknown[];
  authorities?: unknown[];
  roles?: unknown[];
  exp?: number;
}

export interface LojaEscolha {
  id: number;
  nome: string;
}

interface LoginApiResponse {
  // token FULL (login direto) ou token TEMP (tipo: TEMP, válido 5min, usado
  // só pra chamar /user/escolher-loja quando há mais de uma loja vinculada).
  token: string;
  escolherLoja?: boolean;
  lojas?: LojaEscolha[];
  lojaNome?: string | null;
}

export type LoginResult =
  | { requiresLojaSelection: false }
  | { requiresLojaSelection: true; lojas: LojaEscolha[]; tempToken: string };

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



  constructor(
    private http: HttpClient
  ) {}

  login(login: string, password: string) {
    return this.http
      .post<LoginApiResponse>(
        `${this.API}/user/login`,
        { login, password }
      )
      .pipe(
        map((res): LoginResult => {
          // escolherLoja=true → res.token é só o TEMP token, não é sessão válida ainda.
          if (res.escolherLoja) {
            return { requiresLojaSelection: true, lojas: res.lojas ?? [], tempToken: res.token };
          }

          sessionStorage.setItem('token', res.token);
          this.setNomeLoja(res.lojaNome ?? null);
          return { requiresLojaSelection: false };
        })
      );
  }

  /**
   * lojaId: null → "ver todas as lojas" (só permitido se o usuário tiver a
   * role Gerente em pelo menos um vínculo; o backend valida isso).
   * tempToken: o token TEMP recebido em login() quando requiresLojaSelection.
   */
  escolherLoja(lojaId: number | null, tempToken: string) {
    return this.http
      .post<{ token: string; lojaNome?: string | null }>(
        `${this.API}/user/escolher-loja`,
        { lojaId },
        { headers: new HttpHeaders({ Authorization: `Bearer ${tempToken}` }) }
      )
      .pipe(
        tap(res => {
          sessionStorage.setItem('token', res.token);
          this.setNomeLoja(res.lojaNome ?? null);
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

  /**
   * Nome de verdade da pessoa (ex: "João"), não o login (ex: "empresa@joao").
   * Vem direto na claim "nome" do JWT (setada no login/escolher-loja a partir
   * do cadastro do usuario), sem precisar de uma chamada extra a GET /user
   * (que exige a permissao VerUser, que funcionario comum nao tem).
   * Cai pro login só se o usuario nao tiver nome cadastrado.
   */
  getNomeExibicao(): string {
    return this.getPayload()?.nome || this.getUserName() || '';
  }

  getEmpresaId(): number | null {
    return this.getPayload()?.empresaId ?? null;
  }

  getLojaId(): number | null {
    return this.getPayload()?.lojaId ?? null;
  }

  /**
   * true se o funcionario tem o cargo Gerente na loja da sessao atual
   * (ou se escolheu "ver todas as lojas"). Gerente pode trocar livremente
   * de loja nas telas de pedido/estoque; funcionario comum fica travado
   * na loja do token.
   */
  isGerente(): boolean {
    return this.getPayload()?.gerente ?? false;
  }

  /**
   * Nome da loja da sessao atual, guardado no login/escolher-loja (o JWT so
   * carrega o lojaId, nao o nome). null quando o usuario escolheu "ver todas
   * as lojas".
   */
  getNomeLoja(): string | null {
    return sessionStorage.getItem('nomeLoja');
  }

  private setNomeLoja(nome: string | null) {
    if (nome) {
      sessionStorage.setItem('nomeLoja', nome);
    } else {
      sessionStorage.removeItem('nomeLoja');
    }
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
