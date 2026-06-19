import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Product, ProductService } from '../../service/product.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { NavbarAdministradorComponent } from '../../shared/navbar-administrador/navbar-administrador';
import { CategoriaService, Categoria } from '../../service/categoria.service';

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

  categoriaAtualId: number | null = null;
  categoriaAtual: Categoria | null = null;
  categorias: Categoria[] = [];

  constructor(
    private produtoService: ProductService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private categoriaService: CategoriaService
  ) {}

  ngOnInit() {
    this.categoriaService.listar().subscribe({
      next: cats => {
        this.categorias = cats;
        this.todosProdutos = this.preencherCategorias(this.todosProdutos);
        this.atualizarCategoriaAtual();
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.route.queryParams.subscribe(params => {
      const id = params['categoriaId'] ? Number(params['categoriaId']) : null;
      this.categoriaAtualId = id;
      this.atualizarCategoriaAtual();
      this.carregarProdutos(0);
    });
  }

  carregarProdutos(page: number = 0) {
    this.produtoService
      .loadProducts(page, 10, {
        categoriaId: this.categoriaAtualId
      })
      .subscribe({
        next: (res) => {
          this.todosProdutos = this.preencherCategorias(res.content);
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

  private atualizarCategoriaAtual() {
    this.categoriaAtual = this.categoriaAtualId
      ? (this.categorias.find(c => c.id === this.categoriaAtualId) ?? null)
      : null;
  }
}
