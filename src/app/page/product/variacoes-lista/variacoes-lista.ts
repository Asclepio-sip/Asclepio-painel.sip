import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Product, ProductService } from '../../../service/product.service';
import { NavbarAdministradorComponent } from '../../../shared/navbar-administrador/navbar-administrador';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-variacoes-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarAdministradorComponent,
    SidebarComponent
  ],
  templateUrl: './variacoes-lista.html',
  styleUrl: './variacoes-lista.css'
})
export class VariacoesLista implements OnInit {
  produtos: Product[] = [];
  paginaAtual = 0;
  totalPaginas = 0;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarProdutos();
  }

  carregarProdutos(page: number = 0) {
    this.productService.loadProducts(page, 12).subscribe({
      next: response => {
        this.produtos = response.content;
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
}
