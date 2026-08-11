import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cliente {
  id?: string;
  nome: string;
  numero: string;
  email: string;
}

export interface ClienteFiltros {
  nome?: string;
  numero?: string;
  email?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apiUrl = `${environment.apiUrl}/cliente-empresa`;

  constructor(private http: HttpClient) {}

  listar(filtros: ClienteFiltros = {}): Observable<PageResponse<Cliente>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 20);

    params = this.adicionarParametro(params, 'nome', filtros.nome);
    params = this.adicionarParametro(params, 'numero', filtros.numero);
    params = this.adicionarParametro(params, 'email', filtros.email);

    const sort = filtros.sort;
    if (Array.isArray(sort)) {
      sort.forEach(criterio => {
        params = params.append('sort', criterio);
      });
    } else if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<PageResponse<Cliente>>(this.apiUrl, { params });
  }

  criar(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  atualizar(id: string, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  private adicionarParametro(
    params: HttpParams,
    nome: string,
    valor: string | undefined
  ): HttpParams {
    if (!valor) {
      return params;
    }

    return params.set(nome, valor);
  }
}
