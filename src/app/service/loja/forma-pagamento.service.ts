import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FormaPagamento {
  formaPagamento: string;
  descricao?: string;
  ativo: boolean;
}

export interface FormaPagamentoUpdate {
  formaPagamento: string;
  ativo: boolean;
}

export const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  VALE_REFEICAO: 'Vale Refeição',
  VALE_ALIMENTACAO: 'Vale Alimentação',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
  PICPAY: 'PicPay',
  MERCADO_PAGO: 'Mercado Pago',
  PAYPAL: 'PayPal',
  GOOGLE_PAY: 'Google Pay',
  APPLE_PAY: 'Apple Pay',
  TRANSFERENCIA_BANCARIA: 'Transferência Bancária',
  CREDIARIO: 'Crediário',
  CHEQUE: 'Cheque',
  OUTRO: 'Outro'
};

export function getFormaPagamentoLabel(forma: FormaPagamento): string {
  return FORMA_PAGAMENTO_LABELS[forma.formaPagamento] ?? forma.descricao ?? forma.formaPagamento;
}

@Injectable({
  providedIn: 'root'
})
export class FormaPagamentoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarPorLoja(lojaId: number): Observable<FormaPagamento[]> {
    return this.http.get<FormaPagamento[]>(`${this.apiUrl}/lojas/${lojaId}/formas-pagamento`);
  }

  atualizar(lojaId: number, formas: FormaPagamentoUpdate[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/lojas/${lojaId}/formas-pagamento`, formas);
  }
}
