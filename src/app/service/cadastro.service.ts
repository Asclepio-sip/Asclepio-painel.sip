import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CriarContaRequest {
  login: string;
  password: string;
  email: string;
  nomeEmpresa: string;
}

export interface CriarContaResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class CadastroService {

  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  criarConta(payload: CriarContaRequest): Observable<CriarContaResponse> {
    return this.http.post<CriarContaResponse>(
      `${this.apiUrl}/user/CriarConta`,
      payload
    );
  }
}