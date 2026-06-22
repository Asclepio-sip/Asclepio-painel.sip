import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TipoMovimentacaoEstoque =
  | 'ENTRADA_NO_ESTOQUE'
  | 'CRIACAO'
  | 'ATUALIZACAO'
  | 'ENTRADA'
  | 'SAIDA_PEDIDO'
  | 'PROMOCAO'
  | 'DELECAO';

export interface MovimentacaoEstoque {
  id: number;
  estoqueId: number;
  lojaId: number;
  nomeLoja: string;
  produtoId: number | null;
  nomeProduto: string;
  imagemUrl?: string;
  usuario: string;
  tipo: TipoMovimentacaoEstoque;
  quantidadeAntes: number | null;
  quantidadeDepois: number | null;
  precoAntes: number | null;
  precoDepois: number | null;
  descontoAntes: number | null;
  descontoDepois: number | null;
  observacao: string | null;
  criadoEm: string;
}

export interface MovimentacaoEstoqueFiltros {
  lojaId?: number | null;
  produtoId?: number | null;
  estoqueId?: number | null;
  nomeLoja?: string;
  nomeProduto?: string;
  usuario?: string;
  tipo?: TipoMovimentacaoEstoque | '';
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

interface ApiPageResponse<T> {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  totalPages?: number;
  totalElements?: number;
  size?: number;
  number?: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RelatorioEstoqueService {
  private apiUrl = `${environment.apiUrl}/movimentacoes-estoque`;

  constructor(private http: HttpClient) {}

  listar(
    filtros: MovimentacaoEstoqueFiltros = {}
  ): Observable<PageResponse<MovimentacaoEstoque>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 20)
      .set('sort', filtros.sort || 'criadoEm,desc');

    params = this.adicionarParametro(params, 'lojaId', filtros.lojaId);
    params = this.adicionarParametro(params, 'produtoId', filtros.produtoId);
    params = this.adicionarParametro(params, 'estoqueId', filtros.estoqueId);
    params = this.adicionarParametro(params, 'nomeLoja', filtros.nomeLoja);
    params = this.adicionarParametro(params, 'nomeProduto', filtros.nomeProduto);
    params = this.adicionarParametro(params, 'usuario', filtros.usuario);
    params = this.adicionarParametro(params, 'tipo', filtros.tipo);
    params = this.adicionarParametro(params, 'dataInicio', filtros.dataInicio);
    params = this.adicionarParametro(params, 'dataFim', filtros.dataFim);

    return this.http.get<ApiPageResponse<MovimentacaoEstoque>>(
      this.apiUrl,
      { params }
    ).pipe(
      map((response) => {
        const number = response.page?.number ?? response.number ?? 0;
        const totalPages = response.page?.totalPages ?? response.totalPages ?? 0;
        const content = response.content ?? [];

        return {
          content,
          size: response.page?.size ?? response.size ?? content.length,
          number,
          totalElements: response.page?.totalElements ?? response.totalElements ?? content.length,
          totalPages,
          first: response.first ?? number === 0,
          last: response.last ?? (totalPages === 0 || number >= totalPages - 1),
          numberOfElements: response.numberOfElements ?? content.length,
          empty: response.empty ?? content.length === 0
        };
      })
    );
  }

  private adicionarParametro(
    params: HttpParams,
    chave: string,
    valor: string | number | null | undefined
  ): HttpParams {
    if (valor === null || valor === undefined || valor === '') {
      return params;
    }

    return params.set(chave, valor);
  }
}
