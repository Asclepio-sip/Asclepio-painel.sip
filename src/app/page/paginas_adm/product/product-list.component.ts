import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  EstoqueService,
  Estoque
} from '../../../service/estoque.service';

import {
  ProductService,
  Product
} from '../../../service/product.service';

import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { NavbarAdministradorComponent } from '../../../shared/navbar-administrador/navbar-administrador';

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

  /* =========================
     ESTOQUE
  ========================= */

  paginaAtualEstoque = 0;
  totalPaginasEstoque = 0;

  produtos: Estoque[] = [];
  produtosFiltrados: Estoque[] = [];

  lojas: any[] = [];

  lojaSelecionada: number | null = null;

  /* =========================
     PRODUTOS
  ========================= */

  paginaAtualProduto = 0;
  totalPaginasProduto = 0;

  todosProdutos: Product[] = [];

  /* =========================
     GERAL
  ========================= */

  modo: 'estoque' | 'produtos' = 'estoque';

  alterados: Set<number> = new Set();

  constructor(
    private estoqueService: EstoqueService,
    private produtoService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  /* =========================
     ESTOQUE
  ========================= */
carregarDados(
  page: number = 0
) {

  this.modo = 'estoque';

  this.estoqueService
    .listar(page, 10)
    .subscribe({

      next: (res) => {

        console.log(
          'ESTOQUE PAGINADO:',
          res
        );

        this.produtos =
          res.content;

        this.produtosFiltrados =
          [...res.content];

        this.paginaAtualEstoque =
  res.page.number;

this.totalPaginasEstoque =
  res.page.totalPages;
  
        const mapa =
          new Map<number, any>();

        res.content.forEach(
          (e: Estoque) => {

            if (
              !mapa.has(e.lojaId)
            ) {

              mapa.set(
                e.lojaId,
                {
                  id: e.lojaId,
                  nome: e.nomeLoja
                }
              );
            }
          }
        );

        this.lojas =
          Array.from(
            mapa.values()
          );

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Erro ao carregar estoque',
          err
        );
      }
    });
}

proximaPaginaEstoque() {

  console.log(
    'Próxima página:',
    this.paginaAtualEstoque + 1
  );

  if (
    this.paginaAtualEstoque <
    this.totalPaginasEstoque - 1
  ) {

    const novaPagina =
      this.paginaAtualEstoque + 1;

    this.carregarDados(
      novaPagina
    );
  }
}

paginaAnteriorEstoque() {

  console.log(
    'Página anterior:',
    this.paginaAtualEstoque - 1
  );

  if (
    this.paginaAtualEstoque > 0
  ) {

    const novaPagina =
      this.paginaAtualEstoque - 1;

    this.carregarDados(
      novaPagina
    );
  }
}
  mostrarTudo() {

    this.modo = 'estoque';

    this.produtosFiltrados =
      this.produtos;

    this.lojaSelecionada = null;

    this.cdr.detectChanges();
  }

  selecionarLoja(event: any) {

    const lojaId =
      Number(event.target.value);

    this.lojaSelecionada = lojaId;

    if (!lojaId) {

      this.produtosFiltrados =
        this.produtos;

      this.cdr.detectChanges();

      return;
    }

    this.produtosFiltrados =
      this.produtos.filter(
        p => p.lojaId === lojaId
      );

    this.cdr.detectChanges();
  }

  aumentarEstoque(p: Estoque) {

    p.quantidade++;

    this.alterados.add(p.id);
  }

  diminuirEstoque(p: Estoque) {

    if (p.quantidade > 0) {

      p.quantidade--;

      this.alterados.add(p.id);
    }
  }

  estoqueAlterado(p: Estoque) {

    return this.alterados.has(p.id);
  }
atualizarEstoque(
  p: Estoque
) {

  this.estoqueService
    .atualizarEstoque({

      produtoId:
        p.produtoId,

      lojaID:
        p.lojaId,

      quantidade:
        p.quantidade

      // preço não precisa
      // mandar se não mudou
    })
    .subscribe({

      next: () => {

        this.alterados.delete(
          p.id
        );

        console.log(
          'Estoque atualizado'
        );

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Erro ao atualizar estoque',
          err
        );
      }
    });
}

  /* =========================
     PRODUTOS
  ========================= */

mostrarTodosProdutos(
  page: number = 0
) {

  this.produtoService
    .loadProducts(page, 10)
    .subscribe({

      next: (res) => {

        this.todosProdutos =
          res.content;

        this.modo = 'produtos';

        this.paginaAtualProduto =
          res.page.number;

        this.totalPaginasProduto =
          res.page.totalPages;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Erro ao carregar produtos',
          err
        );
      }
    });
}
proximaPaginaProduto() {

  if (
    this.paginaAtualProduto <
    this.totalPaginasProduto - 1
  ) {

    this.mostrarTodosProdutos(
      this.paginaAtualProduto + 1
    );
  }
}

paginaAnteriorProduto() {

  if (
    this.paginaAtualProduto > 0
  ) {

    this.mostrarTodosProdutos(
      this.paginaAtualProduto - 1
    );
  }
}
}