import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarAdministradorComponent } from '../../../shared/navbar-administrador/navbar-administrador';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { Estoque, EstoqueService } from '../../../service/estoque.service';
import { Loja, LojaService } from '../../../service/loja/loja.service';

@Component({
  selector: 'app-atualizar-estoque',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarAdministradorComponent,
    SidebarComponent
  ],
  templateUrl: './atualizar-estoque.html',
  styleUrl: './atualizar-estoque.css',
})
export class AtualizarEstoque implements OnInit {
  paginaAtualEstoque = 0;
  totalPaginasEstoque = 0;

  produtos: Estoque[] = [];
  produtosFiltrados: Estoque[] = [];
  lojas: Loja[] = [];
  lojaSelecionada = '';
  alterados: Set<number> = new Set();

  constructor(
    private estoqueService: EstoqueService,
    private lojaService: LojaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarLojas();
    this.carregarDados();
  }

  carregarDados(page: number = 0) {
    this.estoqueService
      .listar(page, 10)
      .subscribe({
        next: (res) => {
          this.produtos = res.content;
          this.produtosFiltrados = this.filtrarPorLoja(res.content);
          this.paginaAtualEstoque = res.page.number;
          this.totalPaginasEstoque = res.page.totalPages;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar estoque', err);
        }
      });
  }

  carregarLojas() {
    this.lojaService
      .listar()
      .subscribe({
        next: (response) => {
          this.lojas = response.content;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar lojas', err);
        }
      });
  }

  mostrarTudo() {
    this.lojaSelecionada = '';
    this.produtosFiltrados = this.produtos;
    this.cdr.detectChanges();
  }

  selecionarLoja(nomeLoja: string) {
    this.lojaSelecionada = nomeLoja;
    this.produtosFiltrados = this.filtrarPorLoja(this.produtos);
    this.cdr.detectChanges();
  }

  proximaPaginaEstoque() {
    if (this.paginaAtualEstoque < this.totalPaginasEstoque - 1) {
      this.carregarDados(this.paginaAtualEstoque + 1);
    }
  }

  paginaAnteriorEstoque() {
    if (this.paginaAtualEstoque > 0) {
      this.carregarDados(this.paginaAtualEstoque - 1);
    }
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

  atualizarEstoque(p: Estoque) {
    this.estoqueService
      .atualizarEstoque({
        variacaoId: p.variacaoId,
        lojaID: p.lojaId,
        quantidade: p.quantidade
      })
      .subscribe({
        next: () => {
          this.alterados.delete(p.id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao atualizar estoque', err);
        }
      });
  }

  private filtrarPorLoja(produtos: Estoque[]) {
    if (!this.lojaSelecionada) {
      return [...produtos];
    }

    return produtos.filter(p => p.nomeLoja === this.lojaSelecionada);
  }
}
