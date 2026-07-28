import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs';

export interface User {
  id: string;
  login: string;
  username?: string;
  email?: string;
  ativo?: boolean;
  role?: string | Role | Permission[];
  roleId?: string;
  roleName?: string;
  totalPermissoes?: number;
  permissions?: Permission[];
  permissionsExtras?: Permission[];
  permissionExtras?: Permission[];
  permissionIds?: string[];
}

export interface Role {
  id: string;
  nome: string;
  descricao: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  nome: string;
  descricao: string;
}

export interface ListarUsuariosFiltros {
  login?: string;
  ativo?: boolean;
  roleId?: string;
  nomeRole?: string;
  sort?: string | string[];
}

export interface PaginatedUsers {
  users: User[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface PaginatedResponse<T> {
  content?: T[];
  data?: T[];
  items?: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserAdminService {

  private API = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}

  listarUsuarios(page = 0, size = 10, filtros: ListarUsuariosFiltros = {}) {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    params = this.adicionarParametro(params, 'login', filtros.login);
    params = this.adicionarParametro(params, 'roleId', filtros.roleId);
    params = this.adicionarParametro(params, 'nomeRole', filtros.nomeRole);

    if (filtros.ativo !== undefined && filtros.ativo !== null) {
      params = params.set('ativo', filtros.ativo);
    }

    if (filtros.sort) {
      const sorts = Array.isArray(filtros.sort) ? filtros.sort : [filtros.sort];
      sorts.forEach(criterio => {
        params = params.append('sort', criterio);
      });
    }

    return this.http.get<
      User[] | PaginatedResponse<User>
    >(`${this.API}/user`, { params }).pipe(
      map(response => {
        let users: User[];
        let pageInfo = { size, number: page, totalElements: 0, totalPages: 1 };

        if (Array.isArray(response)) {
          users = response;
          pageInfo = { size, number: page, totalElements: users.length, totalPages: 1 };
        } else {
          users = response.content ?? response.data ?? response.items ?? [];
          pageInfo = {
            size: response.page?.size ?? size,
            number: response.page?.number ?? page,
            totalElements: response.page?.totalElements ?? users.length,
            totalPages: response.page?.totalPages ?? 1
          };
        }

        return {
          users: users.map(user => this.normalizarUsuario(user)),
          totalElements: pageInfo.totalElements,
          totalPages: pageInfo.totalPages,
          number: pageInfo.number,
          size: pageInfo.size
        } as PaginatedUsers;
      })
    );
  }

  criarUsuario(
    data: {
      login: string;
      password: string;
      roleId: string;
      Email: string;
      permissionIds?: string[];
    }
  ) {

    return this.http.post<{ token: string }>(
      `${this.API}/user`,
      data
    );
  }

  atualizarUsuario(
    id: string,
    data: {
      login: string;
      password?: string;
      roleId: string;
      Email: string;
      permissionIds: string[];
    }
  ) {

    return this.http.put(
      `${this.API}/user/${id}`,
      data
    );
  }

  listarRoles() {

    return this.http.get<Role[]>(
      `${this.API}/Role`
    );
  }

  listarPermissoes() {

    return this.http.get<Permission[]>(
      `${this.API}/permission`
    );
  }

  private normalizarUsuario(user: User): User {
    const rolePermissions = Array.isArray(user.role) ? user.role : [];
    const extraPermissions = user.permissionsExtras ?? user.permissionExtras ?? [];
    const permissions = user.permissions ?? rolePermissions;

    return {
      ...user,
      login: user.login ?? user.username ?? user.email ?? 'Sem login',
      permissions,
      permissionsExtras: extraPermissions,
      permissionIds: user.permissionIds ?? extraPermissions.map(permission => permission.id)
    };
  }

  private adicionarParametro(
    params: HttpParams,
    chave: string,
    valor: string | number | null | undefined
  ) {
    if (valor === null || valor === undefined || valor === '') {
      return params;
    }

    return params.set(chave, String(valor));
  }
}
