import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CartService } from '../../../../service/cart.service';
import { NavbarFinalizarPedido } from '../../../../shared/navbar-finalizar-pedido/navbar-finalizar-pedido';

@Component({
  selector: 'app-cesta-de-compras',
  standalone: true,
  imports: [
    CommonModule,
    NavbarFinalizarPedido
  ],
  templateUrl: './cesta-de-compras.html',
  styleUrl: './cesta-de-compras.css',
})
export class CestaDeCompras {

  constructor(
    public cartService: CartService,
    private router: Router
  ) {}

  remover(
    produtoId: number,
    lojaId: number
  ) {
    this.cartService.remove(
      produtoId,
      lojaId
    );
  }

  aumentar(
    produtoId: number,
    lojaId: number
  ) {
    this.cartService.aumentar(
      produtoId,
      lojaId
    );
  }

  diminuir(
    produtoId: number,
    lojaId: number
  ) {
    this.cartService.diminuir(
      produtoId,
      lojaId
    );
  }

  irParaHome() {
    this.router.navigate(['/']);
  }

 irParaTelaDados() {
  this.router.navigate([
    '/dados'
  ]);
}
}