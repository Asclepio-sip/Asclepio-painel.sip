import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  HttpClient
} from '@angular/common/http';

import {
  Router
} from '@angular/router';

import Swal from 'sweetalert2';

import {
  CartService
} from '../../../../service/cart.service';

import {
  NavbarFinalizarPedido
} from "../../../../shared/navbar-finalizar-pedido/navbar-finalizar-pedido";
import { environment } from '../../../../../environments/environment';

interface BairroResponse {
  bairroId: number;
  nomeBairro: string;
  valorFrete: number;
}

interface LojaComBairrosResponse {
  lojaId: number;
  nomeLoja: string;
  bairros: BairroResponse[];
}

@Component({
  selector: 'app-finalizar-pedido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarFinalizarPedido
  ],
  templateUrl:
    './finalizar-pedido.html',

  styleUrl:
    './finalizar-pedido.css'
})
export class FinalizarPedido
implements OnInit {

  nomeCliente = '';
  email = '';
  telefone = '';
  endereco = '';
  complemento = '';
  observacao = '';

  
  private API =
    environment.apiUrl;

  bairroId:
    number | null = null;

  formaDePagamento = '';

  lojaId:
    number | null = null;

  tipoEntrega:
    'ENTREGA'
    | 'RETIRADA'
    = 'ENTREGA';

  bairros:
    BairroResponse[] = [];

  constructor(
    private cartService:
      CartService,

    private http:
      HttpClient,

    private router:
      Router
  ) {}

  ngOnInit() {

    this.tipoEntrega =
      history.state
        ?.tipoEntrega
      || 'ENTREGA';

    const itensCarrinho =
      this.cartService
      .getItems();

    if (
      itensCarrinho.length === 0
    ) {
      return;
    }

    this.lojaId =
      itensCarrinho[0]
      .lojaId;

    // só busca bairros se for entrega
    if (
      this.tipoEntrega ===
      'ENTREGA'
    ) {

      this.carregarBairros();
    }
  }

  carregarBairros() {

    this.http.get<
      LojaComBairrosResponse[]
    >(
      `${this.API}/loja-bairros/lojas-com-bairros`
    )
    .subscribe({

      next: (response) => {

        const loja =
          response.find(
            l =>
              l.lojaId ===
              this.lojaId
          );

        if (loja) {

          this.bairros =
            loja.bairros;

        } else {

          this.bairros = [];

          Swal.fire({
            icon: 'warning',
            title:
              'Nenhum bairro encontrado',
            text:
              'Essa loja não possui bairros cadastrados.'
          });
        }
      },

      error: () => {

        Swal.fire({
          icon: 'error',
          title:
            'Erro ao carregar bairros'
        });
      }
    });
  }

  finalizar() {

    const itensCarrinho =
      this.cartService
      .getItems();

    if (
      itensCarrinho
      .length === 0
    ) {

      Swal.fire({
        icon: 'warning',
        title:
          'Carrinho vazio'
      });

      return;
    }

    const itens =
      itensCarrinho.map(
        item => ({
          produtoId:
            item.produtoId,

          quantidade:
            item.quantidade
        })
      );

    const pedido = {

      lojaId:
        this.lojaId,

      bairroId:
        this.tipoEntrega
        === 'RETIRADA'
        ? null
        : this.bairroId,

      nomeCliente:
        this.nomeCliente,

      email:
        this.email,

      telefone:
        this.telefone,

      endereco:
        this.tipoEntrega
        === 'RETIRADA'
        ? ''
        : this.endereco,

      complemento:
        this.complemento,

      observacao:
        this.observacao,

      tipoEntrega:
        this.tipoEntrega,

      formaDePagamento:
        this.formaDePagamento,

      itens
    };

    this.http.post(
       `${this.API}/productsPublico/pedidos`,
      pedido
    )
    .subscribe({

      next: () => {

        Swal.fire({
          title:
            'Pedido realizado! 🚀',

          text:
            'Acompanhe pelo WhatsApp.',

          icon:
            'success',

          confirmButtonColor:
            '#16a34a'
        })
        .then(() => {

          this.cartService
            .clear();

          this.router
            .navigate(['/']);
        });

      },

  error: (err) => {

  console.log('ERRO COMPLETO:', err);

  Swal.fire({
    title: 'Erro ao enviar pedido',
    text:
      err?.error?.message
      || err?.error
      || 'Tente novamente.',
    icon: 'error'
  });
}
    });
  }

  
}