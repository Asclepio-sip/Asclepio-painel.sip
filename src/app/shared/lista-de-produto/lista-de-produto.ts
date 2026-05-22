import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstoqueService, Estoque } from '../../service/estoque.service';
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-lista-de-produto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-de-produto.html',
  styleUrl: './lista-de-produto.css',
})
export class ListaDeProduto implements OnInit {

  @ViewChild('carouselContainer', { static: false })
  carousel!: ElementRef<HTMLDivElement>;

  produtos: Estoque[] = [];

  constructor(
    private estoqueService: EstoqueService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}
ngOnInit() {

  this.estoqueService.listar().subscribe({

    next: (res) => {

      console.log("ESTOQUE API:", res);

      this.produtos = res.content;

      this.cdr.detectChanges();

    },

    error: (err) => {

      console.error("Erro ao carregar estoque", err);

    }

  });

}

 adicionar(produto: Estoque) {
  this.cartService.add(produto);

  console.log(
    'Produto adicionado:',
    produto.nomeProduto,
    'Loja:',
    produto.nomeLoja
  );
}

  scrollLeft() {
    this.carousel.nativeElement.scrollBy({
      left: -300,
      behavior: 'smooth'
    });
  }

  scrollRight() {
    this.carousel.nativeElement.scrollBy({
      left: 300,
      behavior: 'smooth'
    });
  }

}