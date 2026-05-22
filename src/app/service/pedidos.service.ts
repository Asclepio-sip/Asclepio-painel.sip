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


@Injectable({
  providedIn: 'root',
})
export class PedidosService {

  private api =
    `${environment.apiUrl}/pedidos`;

  constructor(
    private http: HttpClient
  ) {}

  listar():
    Observable<Pedido[]> {

    return this.http.get<
      Pedido[]
    >(this.api);
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
  return this.http.get<any[]>(
    `${this.api}/todosPedido`
  );
}



}