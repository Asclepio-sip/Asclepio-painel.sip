import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API =
    environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}

  login(
    login: string,
    password: string
  ) {

    return this.http
      .post<{
        token: string
      }>(
        `${this.API}/auth/login`,
        {
          login,
          password
        }
      )
      .pipe(
        tap(res =>

          sessionStorage.setItem(
            'token',
            res.token
          )
        )
      );
  }

  getToken() {

    return sessionStorage
      .getItem('token');
  }

  logout() {

    sessionStorage.clear();
  }

  isAuthenticated():
    boolean {

    return !!this.getToken();
  }

  isAdmin():
    boolean {

    const token =
      this.getToken();

    if (!token)
      return false;

    try {

      const payload =
        JSON.parse(
          atob(
            token.split('.')[1]
          )
        );

      return (
        payload.role
        === 'ADMIN'
      ) ||

      payload.roles
        ?.includes(
          'ADMIN'
        );

    } catch {

      return false;
    }
  }

  register(
    login: string,
    password: string,
    role:
      'ADMIN'
      | 'USER'
  ) {

    return this.http.post(
      `${this.API}/register`,
      {
        login,
        password,
        role
      }
    );
  }

  getUserName():
    string | null {

    const token =
      this.getToken();

    if (!token)
      return null;

    try {

      const payload =
        JSON.parse(
          atob(
            token.split('.')[1]
          )
        );

      return payload.sub;

    } catch {

      return null;
    }
  }
}