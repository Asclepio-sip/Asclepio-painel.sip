import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Estoque } from './estoque.service';


export interface CartItem {
  produtoId: number;
  variacaoId: number;
  lojaId: number;
  nomeLoja: string;

  nomeProduto: string;
  imagemBase64?: string;
  nomeVariacao: string;

  precoVenda: number;
  valorFinal: number;

  quantidade: number;
    entregar: string;

}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private items: CartItem[] = [];

  private cartSubject =
    new BehaviorSubject<CartItem[]>([]);

  cart$ = this.cartSubject.asObservable();


private lojaAtualId: number | null = null;

private tipoEntregaAtual: string | null = null;

private cartErrorSubject = new BehaviorSubject<string | null>(null);
cartError$ = this.cartErrorSubject.asObservable();

add(produto: Estoque) {

  // 🚨 BLOQUEIA LOJAS DIFERENTES
  if (
    this.lojaAtualId !== null &&
    this.lojaAtualId !== produto.lojaId
  ) {
    this.cartErrorSubject.next(
      'Você não pode adicionar produtos de lojas diferentes.'
    );
    return;
  }

  // 🚨 BLOQUEIA ENTREGA + RETIRADA
  if (
    this.tipoEntregaAtual !== null &&
    this.tipoEntregaAtual !== produto.Entregar
  ) {
    this.cartErrorSubject.next(
      'Você não pode misturar retirada e entrega no mesmo pedido.'
    );
    return;
  }

  // define loja atual
  this.lojaAtualId = produto.lojaId;

  // define tipo do pedido
  this.tipoEntregaAtual = produto.Entregar;

  const existente = this.items.find(
    i =>
      i.variacaoId === produto.variacaoId &&
      i.lojaId === produto.lojaId
  );

  if (existente) {
    existente.quantidade++;
  } else {
    this.items.push({
      produtoId: produto.produtoId,
      variacaoId: produto.variacaoId,
      lojaId: produto.lojaId,
      nomeLoja: produto.nomeLoja,

      nomeProduto: produto.nomeProduto,
      imagemBase64: produto.imagemBase64,
      nomeVariacao: produto.nomeVariacao,

      precoVenda: produto.precoVenda,
      valorFinal: produto.valorFinal,

      quantidade: 1,

      entregar: produto.Entregar // <-- salva no carrinho
    });
  }

  this.cartSubject.next([...this.items]);
}
remove(variacaoId: number, lojaId: number) {

  this.items = this.items.filter(
    i => !(i.variacaoId === variacaoId && i.lojaId === lojaId)
  );

  if (this.items.length === 0) {
    this.lojaAtualId = null;
  }

  this.cartSubject.next([...this.items]);
}

  aumentar(variacaoId: number, lojaId: number) {

    const item = this.items.find(
      i =>
        i.variacaoId === variacaoId &&
        i.lojaId === lojaId
    );

    if (item) {
      item.quantidade++;
    }

    this.cartSubject.next([...this.items]);
  }

  diminuir(variacaoId: number, lojaId: number) {

    const item = this.items.find(
      i =>
        i.variacaoId === variacaoId &&
        i.lojaId === lojaId
    );

    if (!item) return;

    item.quantidade--;

    if (item.quantidade <= 0) {

      this.remove(variacaoId, lojaId);
      return;

    }

    this.cartSubject.next([...this.items]);
  }

  totalItens(): number {

    return this.items.reduce(
      (acc, item) =>
        acc + item.quantidade,
      0
    );

  }

  totalValor(): number {

    return this.items.reduce(
      (acc, item) =>
        acc + (
          item.valorFinal *
          item.quantidade
        ),
      0
    );



  }


getItems(): CartItem[] {
  return this.items;
}

getPedidoItems() {
  return this.items.map(item => ({
    variacaoId: item.variacaoId,
    quantidade: item.quantidade
  }));
}

clear() {

  this.items = [];

  this.lojaAtualId =
    null;

  this.tipoEntregaAtual =
    null;

  this.cartSubject.next([]);
}
}
