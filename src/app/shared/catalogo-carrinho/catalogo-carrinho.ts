import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoCarrinhoItem } from '../../models/catalogo-online.model';

/**
 * Gaveta lateral do carrinho no catálogo público.
 * O carrinho fica no pai (persistido por loja); aqui só se altera via eventos.
 * "Continuar" leva para a página de finalizar (page/catalogo-finalizar).
 */
@Component({
  selector: 'app-catalogo-carrinho',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-carrinho.html',
  styleUrl: './catalogo-carrinho.css',
})
export class CatalogoCarrinhoComponent implements OnInit, OnDestroy {
  @Input() nomeLoja = '';
  @Input() itens: CatalogoCarrinhoItem[] = [];

  @Output() fechar = new EventEmitter<void>();
  @Output() alterarQuantidade = new EventEmitter<{ variacaoId: number; quantidade: number }>();
  @Output() continuar = new EventEmitter<void>();

  private readonly formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private overflowAnterior = '';

  ngOnInit() {
    this.overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = this.overflowAnterior;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.fechar.emit();
  }

  get quantidadeTotal(): number {
    return this.itens.reduce((soma, item) => soma + item.quantidade, 0);
  }

  get subtotal(): number {
    return this.itens.reduce((soma, item) => soma + item.valorFinal * item.quantidade, 0);
  }

  mudarQuantidade(item: CatalogoCarrinhoItem, delta: number) {
    this.alterarQuantidade.emit({ variacaoId: item.variacaoId, quantidade: item.quantidade + delta });
  }

  remover(item: CatalogoCarrinhoItem) {
    this.alterarQuantidade.emit({ variacaoId: item.variacaoId, quantidade: 0 });
  }

  moeda(valor: number): string {
    return this.formatadorMoeda.format(valor);
  }
}
