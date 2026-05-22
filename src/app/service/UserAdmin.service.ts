import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  login: string;
  role: 'ADMIN' | 'USER';
}

@Injectable({
  providedIn: 'root'
})
export class UserAdminService {

  private API =
    `${environment.apiUrl}/register`;

  constructor(
    private http: HttpClient
  ) {}

  listarUsuarios() {

    return this.http.get<
      User[]
    >(this.API);
  }

  atualizarUsuario(
    id: string,
    data: {
      login: string;
      password?: string;
      role: string;
    }
  ) {

    return this.http.put(
      `${this.API}/users/${id}`,
      data
    );
  }
}