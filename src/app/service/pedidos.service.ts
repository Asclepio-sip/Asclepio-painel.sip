import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
      size: String(filtro.size ?? 10),
      sort: filtro.sort || 'criadoEm,desc'
    };

    this.adicionarParametro(params, 'lojaId', filtro.lojaId);
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
