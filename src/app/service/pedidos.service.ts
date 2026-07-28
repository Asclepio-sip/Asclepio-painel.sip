import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Loja, LojaFiltro } from './loja/loja.service';
import { Estoque } from './estoque.service';

export interface ItemPedido {
  produtoId: number;
  variacaoId: number;
  nomeProduto: string;
  variacao: string;
  imagemUrl: string;
  imagemBase64?: string;
  categoria: string;
  precoUnitario: number;
  preco?: number;
  quantidade: number;
  subtotal?: number;
  percentualDesconto?: number;
}
export interface Pedido {

  id: number;
  criado: string;

  cliente: string;
  telefone: string;
  email?: string;
  endereco: string;
  bairro: string;
  complemento: string;

  formaDePagamento: string;

  statusDoPedido: string;
  cep: string;

  itens: ItemPedido[];
  imagemBase64?: string;

  observacao?: string;
  totalProdutos?: number;
  valorFrete?: number;
  totalComFrete?: number;
  freteGratis?: boolean;
  tipoEntrega?: string;
  totalFinal?: number;
}

export interface CriarPedidoItemRequest {
  variacaoId: number;
  quantidade: number;
}

export interface CriarPedidoBalcaoRequest {
  lojaId: number;
  nomeCliente: string;
  email?: string;
  itens: CriarPedidoItemRequest[];
  formaDePagamento: 'PIX' | 'DINHEIRO' | 'CARTAO';
}

export interface PedidoFiltro {
  lojaId?: number | null;
  nomeLoja?: string;
  nomeCliente?: string;
  telefone?: string;
  email?: string;
  status?: string;
  tipoAtendimentoPedido?: string;
  tipoEntrega?: string;
  formaDePagamento?: string;
  dataInicio?: string;
  dataFim?: string;
  bairro?: string;
  freteGratis?: boolean | null;
  somenteHoje?: boolean | null;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}


@Injectable({
  providedIn: 'root',
})
export class PedidosService {

  private pedidosApi =
    `${environment.apiUrl}/pedidos`;

  private pedidosBalcaoApi =
    `${environment.apiUrl}/pedidos/balcao`;

  constructor(
    private http: HttpClient
  ) {}

  criarBalcao(pedido: CriarPedidoBalcaoRequest): Observable<any> {
    return this.http.post(
      this.pedidosBalcaoApi,
      pedido
    );
  }

  criar(pedido: CriarPedidoBalcaoRequest): Observable<any> {
    return this.criarBalcao(pedido);
  }

  listar(
    filtro: PedidoFiltro = {}
  ): Observable<PageResponse<any>> {
    const params: Record<string, string> = {
      page: String(filtro.page ?? 0),
      size: String(filtro.size ?? 20),
      sort: filtro.sort || 'criadoEm,desc'
    };

    this.adicionarParametro(params, 'lojaId', filtro.lojaId);
    this.adicionarParametro(params, 'nomeLoja', filtro.nomeLoja);
    this.adicionarParametro(params, 'nomeCliente', filtro.nomeCliente);
    this.adicionarParametro(params, 'telefone', filtro.telefone);
    this.adicionarParametro(params, 'email', filtro.email);
    this.adicionarParametro(params, 'status', filtro.status);
    this.adicionarParametro(params, 'tipoAtendimentoPedido', filtro.tipoAtendimentoPedido);
    this.adicionarParametro(params, 'tipoEntrega', filtro.tipoEntrega);
    this.adicionarParametro(params, 'formaDePagamento', filtro.formaDePagamento);
    this.adicionarParametro(params, 'dataInicio', filtro.dataInicio);
    this.adicionarParametro(params, 'dataFim', filtro.dataFim);
    this.adicionarParametro(params, 'bairro', filtro.bairro);
    this.adicionarParametro(params, 'freteGratis', filtro.freteGratis);
    this.adicionarParametro(params, 'somenteHoje', filtro.somenteHoje);

    return this.http.get<PageResponse<any>>(
      this.pedidosApi,
      { params }
    );
  }

  geraPdf(
    id: number
  ) {

    return this.http.get(
      `${this.pedidosApi}/${id}/pdf`,
      {
        responseType:
          'blob'
      }
    );
  }

  atualizarStatus(
    id: number,
    status: string
  ) {

    return this.http.patch(
      `${this.pedidosApi}/${id}/status`,
      { status }
    );
  }


  buscarPorId(id: number): Observable<any> {
  return this.http.get<any>(
    `${this.pedidosApi}/${id}`
  );
}

buscarTodosPedidos() {
  return this.listar({
    page: 0,
    size: 1000,
    sort: 'criadoEm,desc'
  });
}

/* =========================
   LOJA / ESTOQUE (PEDIDO)
========================= */

listarLojas(
  page: number = 0,
  size: number = 20,
  filtros: LojaFiltro = {}
): Observable<{ content: Loja[] }> {
  let params = new HttpParams()
    .set('page', page)
    .set('size', size);

  params = this.adicionarParametroHttp(params, 'id', filtros.id);
  params = this.adicionarParametroHttp(params, 'nomeLoja', filtros.nomeLoja);
  params = this.adicionarParametroHttp(params, 'cep', filtros.cep);
  params = this.adicionarParametroHttp(params, 'cnpj', filtros.cnpj);
  params = this.adicionarParametroHttp(params, 'telefone', filtros.telefone);
  params = this.adicionarParametroHttp(params, 'tipoAtendimento', filtros.tipoAtendimento);

  return this.http.get<{ content: Loja[] } | Loja[]>(
    `${environment.apiUrl}/pedidos/loja`,
    { params }
  ).pipe(
    map(response => Array.isArray(response) ? { content: response } : response)
  );
}

relatorioEstoque(
  lojaId?: number,
  nomeLoja?: string,
  semEstoque?: boolean
): Observable<Estoque[]> {
  let params = new HttpParams()
    .set('page', 0)
    .set('size', 1000);

  params = this.adicionarParametroHttp(params, 'lojaId', lojaId);
  params = this.adicionarParametroHttp(params, 'nomeLoja', nomeLoja);
  params = this.adicionarParametroHttp(params, 'semEstoque', semEstoque);

  return this.http.get<{ content: Estoque[] } | Estoque[]>(
    `${environment.apiUrl}/pedidos/estoque`,
    { params }
  ).pipe(
    map(response => {
      const itens = Array.isArray(response) ? response : response.content ?? [];
      return itens.map(item => this.normalizarEstoque(item));
    })
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

private adicionarParametroHttp(
  params: HttpParams,
  chave: string,
  valor: string | number | boolean | null | undefined
): HttpParams {
  if (valor === null || valor === undefined || valor === '') {
    return params;
  }

  return params.set(chave, String(valor));
}

private adicionarParametro(
  params: Record<string, string>,
  chave: string,
  valor: string | number | boolean | null | undefined
) {
  if (valor === null || valor === undefined || valor === '') {
    return;
  }

  params[chave] = String(valor);
}


}
