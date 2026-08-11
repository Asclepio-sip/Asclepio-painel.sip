import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface LojaBairro {
  id?: number;
  lojaId: number;
  bairroId: number;
  valorFrete: number;
}

export interface CriarLojaBairroRequest {
  lojaId: number;
  lojaNome: string;
  bairroId: number;
  bairroNom: string;
  valorFrete: number;
}

export interface LojaBairroFiltro {
  id?: number;
  lojaId?: number;
  nomeLoja?: string;
  bairroId?: number;
  nomeBairro?: string;
  valorFreteMin?: number;
  valorFreteMax?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
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
export class LojaBairroService {

  private apiUrl = `${environment.apiUrl}/loja-bairro`;

  constructor(private http: HttpClient) {}

  listar(filtros: LojaBairroFiltro = {}): Observable<PageResponse<LojaBairro>> {

    let params = new HttpParams()
      .set('page', String(filtros.page ?? 0))
      .set('size', String(filtros.size ?? 20));

    params = this.adicionarParametro(params, 'id', filtros.id);
    params = this.adicionarParametro(params, 'lojaId', filtros.lojaId);
    params = this.adicionarParametro(params, 'nomeLoja', filtros.nomeLoja);
    params = this.adicionarParametro(params, 'bairroId', filtros.bairroId);
    params = this.adicionarParametro(params, 'nomeBairro', filtros.nomeBairro);
    params = this.adicionarParametro(params, 'valorFreteMin', filtros.valorFreteMin);
    params = this.adicionarParametro(params, 'valorFreteMax', filtros.valorFreteMax);
    params = this.adicionarParametro(params, 'sort', filtros.sort);

    return this.http.get<PageResponse<LojaBairro>>(this.apiUrl, { params });
  }

  listarPorLoja(lojaId: number): Observable<PageResponse<LojaBairro>> {
    return this.listar({ lojaId, size: 200 });
  }

  criar(relacao: CriarLojaBairroRequest): Observable<LojaBairro> {
    return this.http.post<LojaBairro>(this.apiUrl, relacao);
  }

  atualizarFrete(id: number, valorFrete: number): Observable<LojaBairro> {
    const params = new HttpParams().set('valorFrete', String(valorFrete));
    return this.http.put<LojaBairro>(`${this.apiUrl}/${id}/frete`, null, { params });
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
