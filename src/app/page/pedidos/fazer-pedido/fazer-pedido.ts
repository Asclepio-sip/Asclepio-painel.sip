import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from '../../../service/cart.service';
import { ListaProdutoEstoque } from '../../../shared/lista-produto-estoque/lista-produto-estoque';

@Component({
  selector: 'app-fazer-pedido',
  standalone: true,
  imports: [CommonModule, ListaProdutoEstoque],
  templateUrl: './fazer-pedido.html',
  styleUrl: './fazer-pedido.css',
})
export class FazerPedido implements OnInit, OnDestroy {
  itens: CartItem[] = [];

  private cartSubscription?: Subscription;

  constructor(
    public cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.itens = items;
    });
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
  }

  aumentar(item: CartItem) {
    this.cartService.aumentar(item.variacaoId, item.lojaId);
  }

  diminuir(item: CartItem) {
    this.cartService.diminuir(item.variacaoId, item.lojaId);
  }

  remover(item: CartItem) {
    this.cartService.remove(item.variacaoId, item.lojaId);
  }

  totalItens(): number {
    return this.itens.reduce((total, item) => total + item.quantidade, 0);
  }

  totalValor(): number {
    return this.itens.reduce(
      (total, item) => total + item.valorFinal * item.quantidade,
      0
    );
  }

  prosseguir() {
    if (this.itens.length === 0) return;
    this.router.navigate(['/finalizar-pedido']);
  }
}
