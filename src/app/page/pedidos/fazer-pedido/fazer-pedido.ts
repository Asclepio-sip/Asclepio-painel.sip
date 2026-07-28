import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from '../../../service/cart.service';
import { CriarPedidoBalcaoRequest, PedidosService } from '../../../service/pedidos.service';
import { ListaProdutoEstoque } from '../../../shared/lista-produto-estoque/lista-produto-estoque';

type FormaDePagamento = 'PIX' | 'DINHEIRO' | 'CARTAO';

const FORMAS_DE_PAGAMENTO: { value: FormaDePagamento; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO', label: 'Cartao' }
];

@Component({
  selector: 'app-fazer-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, ListaProdutoEstoque],
  templateUrl: './fazer-pedido.html',
  styleUrl: './fazer-pedido.css',
})
export class FazerPedido implements OnInit, OnDestroy {
  itens: CartItem[] = [];
  nomeCliente = '';
  formaDePagamento: FormaDePagamento = 'PIX';
  formasDePagamento = FORMAS_DE_PAGAMENTO;
  finalizando = false;
  erro = '';
  sucesso = '';

  private cartSubscription?: Subscription;

  constructor(
    public cartService: CartService,
    private pedidosService: PedidosService
  ) {}

  ngOnInit() {
    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.itens = items;
      this.erro = '';
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

  finalizarPedido() {
    this.erro = '';
    this.sucesso = '';

    const nomeCliente = this.nomeCliente.trim();

    if (!nomeCliente) {
      this.erro = 'Informe o nome do cliente para finalizar a venda.';
      return;
    }

    if (this.itens.length === 0) {
      this.erro = 'Adicione pelo menos um produto ao carrinho.';
      return;
    }

    const lojaId = this.itens[0].lojaId;
    const pedido: CriarPedidoBalcaoRequest = {
      lojaId,
      nomeCliente,
      itens: this.itens.map(item => ({
        variacaoId: item.variacaoId,
        quantidade: item.quantidade
      })),
      formaDePagamento: this.formaDePagamento
    };

    this.finalizando = true;

    this.pedidosService.criarBalcao(pedido).subscribe({
      next: () => {
        this.sucesso = 'Venda finalizada com sucesso.';
        this.nomeCliente = '';
        this.formaDePagamento = 'PIX';
        this.cartService.clear();
        this.finalizando = false;
      },
      error: (err: unknown) => {
        console.error('Erro ao finalizar pedido', err);
        this.erro = 'Nao foi possivel finalizar a venda. Confira os dados e tente novamente.';
        this.finalizando = false;
      }
    });
  }
}
