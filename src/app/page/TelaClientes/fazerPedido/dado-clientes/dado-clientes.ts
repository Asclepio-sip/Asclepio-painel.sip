import {
  Component,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  CartService
} from '../../../../service/cart.service';

import {
  CommonModule
} from '@angular/common';

import {
  NavbarFinalizarPedido
} from "../../../../shared/navbar-finalizar-pedido/navbar-finalizar-pedido";

@Component({
  selector: 'app-dado-clientes',
  imports: [
    CommonModule,
    NavbarFinalizarPedido
  ],
  templateUrl: './dado-clientes.html',
  styleUrl: './dado-clientes.css',
})
export class DadoClientes
implements OnInit {

  modoPedido: string = '';

  tipoEntrega:
    'ENTREGA'
    | 'RETIRADA'
    | '' = '';

  constructor(
    public cartService: CartService,
    private router: Router
  ) {}

ngOnInit() {

  const itens =
    this.cartService.getItems();

  if (itens.length > 0) {

    const entregaCarrinho =
      itens[0].entregar;

    // produto permite entrega
    if (
      entregaCarrinho ===
      'ENTREGA'
    ) {

      this.podeEntregar =
        true;

      this.tipoEntrega =
        'ENTREGA';
    }

    // produto é só retirada
    else {

      this.podeEntregar =
        false;

      this.tipoEntrega =
        'RETIRADA';
    }
  }
}
  mensagemErro: string = '';

podeEntregar: boolean = false;
  podeContinuar(): boolean {

    return (
      this.modoPedido ===
      'rapido'
    );
  }

  irParaTelaDados() {

    if (
      this.podeContinuar()
    ) {

      this.router.navigate(
        ['/finalizar-pedido'],
        {
          state: {
            tipoEntrega:
              this.tipoEntrega
          }
        }
      );
    }
  }

  voltar() {

    this.router.navigate([
      '/cestar'
    ]);
  }

  alterarTelefone() {

    this.router.navigate([
      '/dados'
    ]);
  }

  selecionarEntrega(
  tipo:
    'ENTREGA'
    | 'RETIRADA'
) {

  // bloqueia entrega
  if (
    tipo === 'ENTREGA' &&
    !this.podeEntregar
  ) {

    this.mensagemErro =
      'Este produto só permite retirada na farmácia.';

    setTimeout(() => {

      this.mensagemErro =
        '';

    }, 4000);

    return;
  }

  this.tipoEntrega =
    tipo;
}
}