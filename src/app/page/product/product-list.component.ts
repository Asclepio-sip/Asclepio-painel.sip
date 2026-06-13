import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Product, ProductService } from '../../service/product.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { NavbarAdministradorComponent } from '../../shared/navbar-administrador/navbar-administrador';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    NavbarAdministradorComponent,
    RouterModule
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product.css'
})
export class ProductListComponent implements OnInit {
  paginaAtualProduto = 0;
  totalPaginasProduto = 0;
  todosProdutos: Product[] = [];

  constructor(
    private produtoService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarProdutos();
  }

  carregarProdutos(page: number = 0) {
    this.produtoService
      .loadProducts(page, 10)
      .subscribe({
        next: (res) => {
          this.todosProdutos = res.content;
          this.paginaAtualProduto = res.page?.number ?? res.number ?? page;
          this.totalPaginasProduto = res.page?.totalPages ?? res.totalPages ?? 0;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar produtos', err);
        }
      });
  }

  proximaPaginaProduto() {
    if (this.paginaAtualProduto < this.totalPaginasProduto - 1) {
      this.carregarProdutos(this.paginaAtualProduto + 1);
    }
  }

  paginaAnteriorProduto() {
    if (this.paginaAtualProduto > 0) {
      this.carregarProdutos(this.paginaAtualProduto - 1);
    }
  }
}
