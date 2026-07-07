import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Estoque, EstoqueService } from '../../../service/estoque.service';
import { Loja, LojaService } from '../../../service/loja/loja.service';
import { ProductService } from '../../../service/product.service';
import { forkJoin, map, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-atualizar-estoque',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
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
  precosEmEdicao: Set<number> = new Set();
  precosAlterados: Set<number> = new Set();
  promocoesEmEdicao: Set<number> = new Set();

  constructor(
    private estoqueService: EstoqueService,
    private lojaService: LojaService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarLojas();
    this.carregarDados();
  }

  carregarDados(page: number = 0) {
    this.estoqueService
      .listar(page, 10)
      .pipe(
        switchMap((res) => {
          const itensSemVariacao = res.content.filter((item) => !item.variacaoId);

          if (itensSemVariacao.length === 0) {
            return of(res);
          }

          return forkJoin(
            itensSemVariacao.map((item) =>
              this.productService.listarVariacoes(item.produtoId).pipe(
                map((variacoes) => {
                  const nomeVariacao = this.normalizarTexto(item.nomeVariacao);
                  const variacao = variacoes.find((v) =>
                    this.normalizarTexto(v.nomeVariacao) === nomeVariacao
                  );

                  item.variacaoId = variacao?.id ?? 0;
                })
              )
            )
          ).pipe(map(() => res));
        })
      )
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

  editarPreco(p: Estoque) {
    this.precosEmEdicao.add(p.id);
  }

  finalizarEdicaoPreco(p: Estoque) {
    this.precosEmEdicao.delete(p.id);
  }

  precoEmEdicao(p: Estoque) {
    return this.precosEmEdicao.has(p.id);
  }

  marcarPrecoAlterado(p: Estoque) {
    this.alterados.add(p.id);
    this.precosAlterados.add(p.id);
  }

  editarPromocao(p: Estoque) {
    this.promocoesEmEdicao.add(p.id);
  }

  promocaoEmEdicao(p: Estoque) {
    return this.promocoesEmEdicao.has(p.id);
  }

  cancelarPromocao(p: Estoque) {
    this.promocoesEmEdicao.delete(p.id);
  }

  aplicarPromocao(p: Estoque) {
    if (!p.variacaoId) {
      Swal.fire('Erro', 'Nao foi possivel identificar a variacao deste item.', 'error');
      return;
    }

    if (p.percentualDesconto < 0 || p.percentualDesconto > 100) {
      Swal.fire('Atencao', 'Informe um percentual entre 0 e 100.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Aplicar promoção?',
      text: p.percentualDesconto === 0
        ? 'O desconto atual será removido.'
        : `Será aplicado um desconto de ${p.percentualDesconto}% em ${p.nomeProduto}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.estoqueService.aplicarPromocao({
        lojaId: p.lojaId,
        produtoId: p.variacaoId,
        percentual: p.percentualDesconto
      }).subscribe({
        next: () => {
          this.promocoesEmEdicao.delete(p.id);
          Swal.fire('Promoção aplicada!', 'O desconto foi atualizado com sucesso.', 'success');
          this.carregarDados(this.paginaAtualEstoque);
        },
        error: (err) => {
          console.error('Erro ao aplicar promocao', err);
          Swal.fire('Erro', 'Nao foi possivel aplicar a promoção.', 'error');
        }
      });
    });
  }

  atualizarEstoque(p: Estoque) {
    if (!p.variacaoId) {
      Swal.fire('Erro', 'Nao foi possivel identificar a variacao deste item.', 'error');
      return;
    }

    if (p.precoVenda === null || p.precoVenda === undefined || p.precoVenda < 0) {
      Swal.fire('Atencao', 'Informe um preco de venda valido.', 'warning');
      return;
    }

    const precoAlterado = this.precosAlterados.has(p.id);

    Swal.fire({
      title: precoAlterado
        ? 'Tem certeza que deseja atualizar o preço?'
        : 'Tem certeza que deseja atualizar o estoque?',
      text: precoAlterado
        ? `O novo preço será ${p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
        : `A nova quantidade será ${p.quantidade}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, atualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmarAtualizacao(p);
      }
    });
  }

  private confirmarAtualizacao(p: Estoque) {
    this.estoqueService
      .atualizarEstoque({
        // O PATCH chama o campo de produtoId, mas o estoque e identificado
        // no backend pela variacao cadastrada para a loja.
        produtoId: p.variacaoId,
        lojaID: p.lojaId,
        quantidade: p.quantidade,
        precoVenda: p.precoVenda
      })
      .subscribe({
        next: () => {
          this.alterados.delete(p.id);
          this.precosEmEdicao.delete(p.id);
          this.precosAlterados.delete(p.id);
          this.cdr.detectChanges();
          Swal.fire('Atualizado!', 'O estoque foi atualizado com sucesso.', 'success');
        },
        error: (err) => {
          console.error('Erro ao atualizar estoque', err);
          Swal.fire('Erro', 'Nao foi possivel atualizar o estoque.', 'error');
        }
      });
  }

  private filtrarPorLoja(produtos: Estoque[]) {
    if (!this.lojaSelecionada) {
      return [...produtos];
    }

    return produtos.filter(p => p.nomeLoja === this.lojaSelecionada);
  }

  private normalizarTexto(valor?: string) {
    return (valor ?? '').trim().toLocaleLowerCase('pt-BR');
  }
}
