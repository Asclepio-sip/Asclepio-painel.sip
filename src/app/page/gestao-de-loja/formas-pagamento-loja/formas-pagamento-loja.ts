import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { FormaPagamento, FormaPagamentoService, getFormaPagamentoLabel } from '../../../service/loja/forma-pagamento.service';

const ICONE_CARTEIRA_DIGITAL = 'M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 18h.01';
const ICONE_BANCO = 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6';

const ICONES: Record<string, string> = {
  DINHEIRO: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  PIX: 'M7 7l10 10M17 7L7 17',
  CARTAO_CREDITO: 'M2 10h20M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z',
  CARTAO_DEBITO: 'M2 10h20M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z',
  VALE_REFEICAO: 'M3 3h18v4H3zM3 10h18v11H3z',
  VALE_ALIMENTACAO: 'M3 3h18v4H3zM3 10h18v11H3z',
  BOLETO: 'M4 4h4v16H4zM10 4h1v16h-1zM13 4h2v16h-2zM17 4h1v16h-1zM20 4h1v16h-1z',
  TRANSFERENCIA: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3',
  PICPAY: ICONE_CARTEIRA_DIGITAL,
  MERCADO_PAGO: ICONE_CARTEIRA_DIGITAL,
  PAYPAL: ICONE_CARTEIRA_DIGITAL,
  GOOGLE_PAY: ICONE_CARTEIRA_DIGITAL,
  APPLE_PAY: ICONE_CARTEIRA_DIGITAL,
  TRANSFERENCIA_BANCARIA: ICONE_BANCO,
  CREDIARIO: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01'
};

@Component({
  selector: 'app-formas-pagamento-loja',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './formas-pagamento-loja.html',
  styleUrls: ['./formas-pagamento-loja.css']
})
export class FormasPagamentoLoja implements OnInit {

  lojaId!: number;

  formas: FormaPagamento[] = [];

  carregando = false;
  salvando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formaPagamentoService: FormaPagamentoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.lojaId = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarFormas();
  }

  carregarFormas() {

    this.carregando = true;

    this.formaPagamentoService.listarPorLoja(this.lojaId).subscribe({

      next: (dados) => {

        this.formas = [...dados];

        this.carregando = false;
        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);

        this.carregando = false;

        Swal.fire('Erro', 'Erro ao carregar formas de pagamento', 'error');
      }
    });
  }

  alternar(forma: FormaPagamento) {
    forma.ativo = !forma.ativo;
  }

  salvar() {

    this.salvando = true;

    const payload = this.formas.map(f => ({
      formaPagamento: f.formaPagamento,
      ativo: f.ativo
    }));

    this.formaPagamentoService.atualizar(this.lojaId, payload).subscribe({

      next: () => {

        this.salvando = false;

        Swal.fire('Sucesso', 'Formas de pagamento atualizadas com sucesso!', 'success');
      },

      error: (err) => {

        console.error(err);

        this.salvando = false;

        Swal.fire('Erro', 'Erro ao atualizar formas de pagamento', 'error');
      }
    });
  }

  voltar() {
    this.router.navigate(['/loja']);
  }

  getIcone(formaPagamento: string): string {
    return ICONES[formaPagamento] ?? 'M4 4h16v16H4z';
  }

  getLabel(forma: FormaPagamento): string {
    return getFormaPagamentoLabel(forma);
  }
}
