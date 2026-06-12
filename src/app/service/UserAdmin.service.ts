import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  permissions?: Permission[];
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

interface PaginatedResponse<T> {
  content?: T[];
  data?: T[];
  items?: T[];
}

@Injectable({
  providedIn: 'root'
})
export class UserAdminService {

  private API = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}

  listarUsuarios(page = 0, size = 10) {

    return this.http.get<
      User[] | PaginatedResponse<User>
    >(`${this.API}/user`, {
      params: {
        page,
        size
      }
    }).pipe(
      map(response => {
        let users: User[];

        if (Array.isArray(response)) {
          users = response;
        } else {
          users = response.content ?? response.data ?? response.items ?? [];
        }

        return users.map(user => this.normalizarUsuario(user));
      })
    );
  }

  criarUsuario(
    data: {
      login: string;
      password: string;
      roleId: string;
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

    return {
      ...user,
      login: user.login ?? user.username ?? user.email ?? 'Sem login',
      permissions: user.permissions ?? rolePermissions,
      permissionIds: user.permissionIds ?? rolePermissions.map(permission => permission.id)
    };
  }
}
