import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EstoqueRequest {
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

    let params = new HttpParams();

    if (lojaId !== undefined) {
      params = params.set(
        'lojaId',
        lojaId
      );
    }

    if (nomeLoja) {
      params = params.set(
        'nomeLoja',
        nomeLoja
      );
    }

    if (semEstoque !== undefined) {
      params = params.set(
        'semEstoque',
        semEstoque
      );
    }

    return this.http.get<Estoque[]>(
      `${this.api}/filtro`,
      { params }
    ).pipe(
      map(estoques => estoques.map(item => this.normalizarEstoque(item)))
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
