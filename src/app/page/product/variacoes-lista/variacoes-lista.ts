import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Categoria } from '../../../service/categoria.service';
import { Product, ProductService } from '../../../service/product.service';

@Component({
  selector: 'app-variacoes-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './variacoes-lista.html',
  styleUrl: './variacoes-lista.css'
})
export class VariacoesLista implements OnInit {
  produtos: Product[] = [];
  categorias: Categoria[] = [];
  paginaAtual = 0;
  totalPaginas = 0;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.productService.getCategoriasVariacao().subscribe({
      next: categorias => {
        this.categorias = categorias;
        this.produtos = this.preencherCategorias(this.produtos);
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erro ao carregar categorias', err);
      }
    });

    this.carregarProdutos();
  }

  carregarProdutos(page: number = 0) {
    this.productService.loadProdutosVariacao(page, 12).subscribe({
      next: response => {
        this.produtos = this.preencherCategorias(response.content);
        this.paginaAtual = response.page?.number ?? response.number ?? page;
        this.totalPaginas = response.page?.totalPages ?? response.totalPages ?? 0;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erro ao carregar produtos', err);
      }
    });
  }

  proximaPagina() {
    if (this.paginaAtual < this.totalPaginas - 1) {
      this.carregarProdutos(this.paginaAtual + 1);
    }
  }

  paginaAnterior() {
    if (this.paginaAtual > 0) {
      this.carregarProdutos(this.paginaAtual - 1);
    }
  }

  private preencherCategorias(produtos: Product[]): Product[] {
    return produtos.map(produto => {
      const categoria = produto.categoriaId
        ? this.categorias.find(cat => cat.id === produto.categoriaId)
        : undefined;

      return {
        ...produto,
        categoria: produto.categoria ?? categoria,
        categoriaNome:
          produto.categoriaNome ||
          produto.nomeCategoria ||
          categoria?.nomeCategoria ||
          ''
      };
    });
  }
}
