import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ItemPedido {
  produtoId: number;
 nomeProduto: string;
variacao: string;
imagemBase64: string;
categoria: string;

preco: number;
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

export interface PedidoFiltro {
  lojaId?: number | null;
  nomeCliente?: string;
  telefone?: string;
  status?: string;
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

  private api =
    `${environment.apiUrl}/pedidos`;

  constructor(
    private http: HttpClient
  ) {}

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
    this.adicionarParametro(params, 'status', filtro.status);
    this.adicionarParametro(params, 'tipoEntrega', filtro.tipoEntrega);
    this.adicionarParametro(params, 'formaDePagamento', filtro.formaDePagamento);
    this.adicionarParametro(params, 'dataInicio', filtro.dataInicio);
    this.adicionarParametro(params, 'dataFim', filtro.dataFim);
    this.adicionarParametro(params, 'bairro', filtro.bairro);
    this.adicionarParametro(params, 'freteGratis', filtro.freteGratis);

    return this.http.get<PageResponse<any>>(
      this.api,
      { params }
    );
  }

  geraPdf(
    id: number
  ) {

    return this.http.get(
      `${this.api}/${id}/pdf`,
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
      `${this.api}/${id}/status`,
      { status }
    );
  }


  buscarPorId(id: number): Observable<any> {
  return this.http.get<any>(
    `${this.api}/${id}`
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
