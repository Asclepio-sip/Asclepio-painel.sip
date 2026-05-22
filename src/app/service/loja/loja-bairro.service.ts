import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface LojaBairro {
  id?: number;

  lojaId: number;
  bairroId: number;

  valorFrete: number;
}

@Injectable({
  providedIn: 'root'
})
export class LojaBairroService {

  private apiUrl = `${environment.apiUrl}/loja-bairros`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<LojaBairro[]> {
    return this.http.get<LojaBairro[]>(this.apiUrl);
  }

  listarPorLoja(lojaId: number): Observable<LojaBairro[]> {
    return this.http.get<LojaBairro[]>(
      `${this.apiUrl}/loja/${lojaId}`
    );
  }

  criar(relacao: LojaBairro) {
    return this.http.post(this.apiUrl, relacao);
  }

  deletar(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}