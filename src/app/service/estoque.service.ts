import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EstoqueRequest {
  produtoId: number;
  variacaoId: number;
  lojaID: number;
  nomeLoja?: string;
  nomeProduto?: string;
  quantidade: number;
  precoVenda: number;
  percentualDesconto?: number;
}

export interface AtualizarEstoqueRequest {
  lojaID: number;
  produtoId: number;
  quantidade: number;
  precoVenda?: number;
}

export interface AplicarPromocaoRequest {
  lojaId: number;
  produtoId: number;
  percentual: number;
}

export interface Estoque {

  id: number;

  lojaId: number;
  nomeLoja: string;

  produtoId: number;
  nomeProduto: string;
  variacaoId: number;
  nomeVariacao: string;

  imagemBase64: string;
  imagemUrl?: string;

  quantidade: number;

  precoVenda: number;

  percentualDesconto: number;

  valorFinal: number;
  Entregar: string;
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

export interface EstoqueFiltros {
  lojaId?: number;
  nomeLoja?: string;
  nomeProduto?: string;
  nomeVariacao?: string;
  categoriaId?: number;
  nomeCategoria?: string;
  semEstoque?: boolean;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export interface EstoqueLoja {
  id: number;
  nomeLoja: string;
}

export interface EstoqueLojaFiltros {
  id?: number | null;
  nomeLoja?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {

  private api = `${environment.apiUrl}/estoque`;

  constructor(
    private http: HttpClient
  ) {}

  salvar(data: EstoqueRequest): Observable<any> {

    return this.http.post(
      this.api,
      data
    );
  }

  listar(
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<Estoque>> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResponse<Estoque>>(
      `${this.api}/relatorio`,
      { params }
    ).pipe(
      map(response => ({
        ...response,
        content: response.content.map(item => this.normalizarEstoque(item))
      }))
    );
  }

  filtrar(
    lojaId?: number,
    nomeLoja?: string,
    semEstoque?: boolean
  ): Observable<Estoque[]> {

    return this.relatorio({
      lojaId,
      nomeLoja,
      semEstoque,
      page: 0,
      size: 1000
    }).pipe(
      map(response => response.content)
    );
  }

  relatorio(filtros: EstoqueFiltros = {}): Observable<PageResponse<Estoque>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 20);

    params = this.adicionarParametro(params, 'lojaId', filtros.lojaId);
    params = this.adicionarParametro(params, 'nomeLoja', filtros.nomeLoja);
    params = this.adicionarParametro(params, 'nomeProduto', filtros.nomeProduto);
    params = this.adicionarParametro(params, 'nomeVariacao', filtros.nomeVariacao);
    params = this.adicionarParametro(params, 'categoriaId', filtros.categoriaId);
    params = this.adicionarParametro(params, 'nomeCategoria', filtros.nomeCategoria);
    params = this.adicionarParametro(params, 'semEstoque', filtros.semEstoque);

    const sort = filtros.sort;
    if (Array.isArray(sort)) {
      sort.forEach(criterio => {
        params = params.append('sort', criterio);
      });
    } else if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<PageResponse<Estoque>>(
      `${this.api}/relatorio`,
      { params }
    ).pipe(
      map(response => ({
        ...response,
        content: response.content.map(item => this.normalizarEstoque(item))
      }))
    );
  }


  listarLojas(
    filtros: EstoqueLojaFiltros = {}
  ): Observable<PageResponse<EstoqueLoja>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 1000);

    params = this.adicionarParametro(params, 'id', filtros.id);
    params = this.adicionarParametro(params, 'nomeLoja', filtros.nomeLoja);

    return this.http.get<PageResponse<EstoqueLoja>>(
      `${this.api}/loja`,
      { params }
    );
  }

  atualizarEstoque(
  data: AtualizarEstoqueRequest
): Observable<any> {

  return this.http.patch(
    `${this.api}`,
    data
  );
}

aplicarPromocao(data: AplicarPromocaoRequest): Observable<void> {
  return this.http.patch<void>(
    `${this.api}/promocao`,
    data
  );
}

private adicionarParametro(
  params: HttpParams,
  nome: string,
  valor: string | number | boolean | null | undefined
): HttpParams {
  if (valor === null || valor === undefined || valor === '') {
    return params;
  }

  return params.set(nome, valor);
}

private normalizarEstoque(item: any): Estoque {
  const imagemBase64 = item.imagemBase64 ?? '';

  return {
    ...item,
    imagemBase64,
    imagemUrl:
      item.imagemUrl ??
      item.produto?.imagemUrl ??
      item.produtoVariacao?.produto?.imagemUrl ??
      (imagemBase64 ? `data:image/png;base64,${imagemBase64}` : ''),
    nomeProduto:
      item.nomeProduto ??
      item.produto?.name ??
      item.produtoVariacao?.produto?.name ??
      '',
    produtoId:
      item.produtoId ??
      item.produto?.id ??
      item.produtoVariacao?.produto?.id ??
      0,
    variacaoId:
      item.variacaoId ??
      item.VaricaoId ??
      item.VaricaoID ??
      item.produtoVariacaoId ??
      item.variacaoProdutoId ??
      item.idVariacao ??
      item.produtoVariacao?.id ??
      0,
    nomeVariacao:
      item.nomeVariacao ??
      item.variacao ??
      item.Variacao ??
      item.produtoVariacao?.nomeVariacao ??
      item.produtoVariacao?.Variacao ??
      item.produtoVariacao?.nome ??
      ''
  };
}
}
