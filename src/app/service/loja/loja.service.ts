import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Loja {
  id?: number;
  nomeLoja: string;
  cep: string;
  cnpj?: string | null;
  telefone: string;
  textoDescricao?: string | null;
  TextoDescricao?: string | null;
  tipoAtendimento: string;
  valorMinimoFreteGratis?: number | null;
  imagemUrl?: string | null;
}

export interface LojaFiltro {
  id?: number | null;
  nomeLoja?: string;
  cep?: string;
  cnpj?: string;
  telefone?: string;
  tipoAtendimento?: string;
}

export interface PageResponse<T> {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  size?: number;
  number?: number;
  totalElements?: number;
  totalPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LojaService {

  private apiUrl = `${environment.apiUrl}/lojas`;

  constructor(private http: HttpClient) {}

  listar(
    page: number = 0,
    size: number = 20,
    filtros: LojaFiltro = {}
  ): Observable<PageResponse<Loja>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    params = this.adicionarParametro(params, 'id', filtros.id);
    params = this.adicionarParametro(params, 'nomeLoja', filtros.nomeLoja);
    params = this.adicionarParametro(params, 'cep', filtros.cep);
    params = this.adicionarParametro(params, 'cnpj', filtros.cnpj);
    params = this.adicionarParametro(params, 'telefone', filtros.telefone);
    params = this.adicionarParametro(params, 'tipoAtendimento', filtros.tipoAtendimento);

    return this.http.get<PageResponse<Loja>>(this.apiUrl, { params });
  }

  criar(loja: Loja) {
    return this.http.post(this.apiUrl, this.normalizarLojaRequest(loja));
  }

  atualizar(id: number, loja: Loja) {
    return this.http.put(`${this.apiUrl}/${id}`, this.normalizarLojaRequest(loja));
  }

  deletar(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorId(id: number) {
    return this.http.get<Loja>(`${this.apiUrl}/${id}`);
  }

  private normalizarLojaRequest(loja: Loja): Loja {
    return {
      ...loja,
      tipoAtendimento:
        loja.tipoAtendimento === 'DELIVERY'
          ? 'ENTREGA'
          : loja.tipoAtendimento === 'PRESENCIAL'
            ? 'RETIRADA'
            : loja.tipoAtendimento
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
