import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type AgrupamentoDashboard = 'DIA' | 'SEMANA' | 'MES';

export interface ResumoFinanceiro {
  /** Itens vendidos (sem frete), já com desconto. */
  faturamento: number;
  /** Custo dos itens vendidos (gastos). */
  custo: number;
  lucro: number;
  /** % do faturamento; null sem vendas. */
  margem: number | null;
  pedidos: number;
  ticketMedio: number | null;
  /** Faturamento de itens sem preço de custo (o custo deles conta como 0). */
  vendasSemCusto: number;
  /** Parte do custo estimada pelo custo atual do estoque (pedidos antigos). */
  custoEstimado: number;
}

export interface PontoFinanceiro {
  inicio: string;
  fim: string;
  rotulo: string;
  faturamento: number;
  custo: number;
  lucro: number;
  pedidos: number;
}

export interface ProdutoVendido {
  produtoId: number;
  nome: string;
  quantidade: number;
  /** Itens desse produto (sem frete), já com desconto. */
  faturamento: number;
  pedidos: number;
}

export interface ClienteComprador {
  /** null = pedido sem cliente cadastrado (agrupado por telefone, e-mail ou nome). */
  clienteId: string | null;
  nome: string;
  telefone: string | null;
  /** Itens comprados (sem frete), já com desconto. */
  valor: number;
  pedidos: number;
  ultimaCompra: string;
}

export interface DashboardFinanceiro {
  inicio: string;
  fim: string;
  agrupamento: AgrupamentoDashboard;
  resumo: ResumoFinanceiro;
  /** Mesmo número de dias, logo antes do período. */
  periodoAnterior: ResumoFinanceiro;
  serie: PontoFinanceiro[];
  /** Até 10, por unidades vendidas. */
  produtosMaisVendidos: ProdutoVendido[];
  /** Até 10, por valor gasto. */
  clientesQueMaisCompraram: ClienteComprador[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private api = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /** Datas em yyyy-MM-dd (inclusivas). lojaId null = todas as lojas da empresa. */
  financeiro(inicio: string, fim: string, lojaId: number | null): Observable<DashboardFinanceiro> {
    let params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);

    if (lojaId !== null) {
      params = params.set('lojaId', lojaId);
    }

    return this.http.get<DashboardFinanceiro>(`${this.api}/financeiro`, { params });
  }
}
