import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Loja {
  id?: number;
  nomeLoja: string;
  cep: string;
  cpnj?: string | null;
  telefone: string;
  textoDescricao?: string | null;
  tipoAtendimento: string;
  valorMinimoFreteGratis?: number | null;
  imagemUrl?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LojaService {

  private apiUrl = `${environment.apiUrl}/lojas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Loja[]> {
    return this.http.get<Loja[]>(this.apiUrl);
  }

  criar(loja: Loja) {
    return this.http.post(this.apiUrl, loja);
  }

  atualizar(id: number, loja: Loja) {
    return this.http.put(`${this.apiUrl}/${id}`, loja);
  }

  deletar(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorId(id: number) {
    return this.http.get<Loja>(`${this.apiUrl}/${id}`);
  }
}