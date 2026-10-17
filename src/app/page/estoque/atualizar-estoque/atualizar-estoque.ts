import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../service/auth.service';
import { Estoque, EstoqueLoja, EstoqueService } from '../../../service/estoque.service';
import { ProductService } from '../../../service/product.service';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

type TipoDesconto = 'PERCENTUAL' | 'VALOR';

/** Campos editados no modal (cópia: só vai para a tabela depois de salvar). */
interface EdicaoEstoque {
  item: Estoque;
  quantidade: number | null;
  precoVenda: number | null;
  /** Opcionais. O PATCH trata null como "não altera". */
  precoCusto: number | null;
  estoqueMinimo: number | null;
  mostrarNoCatalogo: boolean;
  tipoDesconto: TipoDesconto;
  /** % (0–100) ou R$, conforme tipoDesconto. */
  desconto: number | null;
}

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
  lojas: EstoqueLoja[] = [];
  /** Loja usada no filtro atual. Gerente pode trocar; null = todas as lojas. */
  lojaSelecionadaId: number | null = null;
  /** Loja da sessao do funcionario (JWT). Se definida, trava o estoque nela. */
  lojaSessaoId: number | null = null;
  lojaSessaoTravada = false;
  /** Mostra só itens com quantidade igual ou abaixo do estoque mínimo. */
  somenteEstoqueBaixo = false;
  /** Mostra só itens escondidos do catálogo online. */
  somenteForaDoCatalogo = false;
  /** Ids de estoque com o switch "catálogo" salvando agora. */
  alternandoCatalogo = new Set<number>();

  /** Item aberto no modal de edição (null = modal fechado). */
  edicao: EdicaoEstoque | null = null;
  salvando = false;

  constructor(
    private estoqueService: EstoqueService,
    private productService: ProductService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.lojaSessaoId = this.authService.getLojaId();
    this.lojaSessaoTravada = this.lojaSessaoId !== null;
    this.lojaSelecionadaId = this.lojaSessaoId;

    this.carregarLojas();
    this.carregarDados();
  }

  carregarDados(page: number = 0) {
    const lojaId = this.lojaSessaoTravada ? this.lojaSessaoId! : this.lojaSelecionadaId;

    const estoqueBaixo = this.somenteEstoqueBaixo || undefined;
    const mostrarNoCatalogo = this.somenteForaDoCatalogo ? false : undefined;
    const busca = lojaId !== null || estoqueBaixo || mostrarNoCatalogo === false
      ? this.estoqueService.relatorio({ lojaId: lojaId ?? undefined, estoqueBaixo, mostrarNoCatalogo, page, size: 10 })
      : this.estoqueService.listar(page, 10);

    busca
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
    this.estoqueService
      .listarLojas(this.lojaSessaoTravada ? { id: this.lojaSessaoId! } : {})
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
    this.lojaSelecionadaId = null;
    this.carregarDados(0);
  }

  selecionarLoja(lojaId: number | null) {
    this.lojaSelecionadaId = lojaId;
    this.carregarDados(0);
  }

  alternarEstoqueBaixo() {
    this.somenteEstoqueBaixo = !this.somenteEstoqueBaixo;
    this.carregarDados(0);
  }

  alternarForaDoCatalogo() {
    this.somenteForaDoCatalogo = !this.somenteForaDoCatalogo;
    this.carregarDados(0);
  }

  /** Switch da tabela: salva na hora (troca otimista, volta se der erro). */
  alternarCatalogo(p: Estoque) {
    if (this.alternandoCatalogo.has(p.id) || !p.variacaoId) return;

    const novo = !p.mostrarNoCatalogo;
    p.mostrarNoCatalogo = novo;
    this.alternandoCatalogo.add(p.id);

    this.estoqueService.atualizarEstoque({
      produtoId: p.variacaoId,
      lojaID: p.lojaId,
      quantidade: p.quantidade,
      mostrarNoCatalogo: novo
    }).subscribe({
      next: () => {
        this.alternandoCatalogo.delete(p.id);
        // No filtro "fora do catálogo", o item que voltou a aparecer sai da lista
        if (this.somenteForaDoCatalogo && novo) {
          this.carregarDados(this.paginaAtualEstoque);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        p.mostrarNoCatalogo = !novo;
        this.alternandoCatalogo.delete(p.id);
        this.cdr.detectChanges();
        Swal.fire('Erro', err?.error?.message || 'Não foi possível alterar a visibilidade no catálogo.', 'error');
      }
    });
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

  // ── Modal de edição ──

  abrirEdicao(p: Estoque) {
    this.edicao = {
      item: p,
      quantidade: p.quantidade,
      precoVenda: p.precoVenda,
      precoCusto: p.precoCusto,
      estoqueMinimo: p.estoqueMinimo,
      mostrarNoCatalogo: p.mostrarNoCatalogo,
      tipoDesconto: 'PERCENTUAL',
      desconto: Number(p.percentualDesconto) || 0,
    };
  }

  @HostListener('document:keydown.escape')
  fecharEdicao() {
    if (this.salvando) return;
    this.edicao = null;
  }

  alterarQuantidade(delta: number) {
    if (!this.edicao) return;
    this.edicao.quantidade = Math.max(0, (this.edicao.quantidade ?? 0) + delta);
  }

  /** Troca % ↔ R$ mantendo o mesmo desconto em dinheiro. */
  trocarTipoDesconto(tipo: TipoDesconto) {
    const e = this.edicao;
    if (!e || e.tipoDesconto === tipo) return;

    const valor = this.valorDesconto;
    e.tipoDesconto = tipo;

    if (tipo === 'VALOR') {
      e.desconto = valor ? this.arredondar(valor) : 0;
    } else {
      const preco = e.precoVenda ?? 0;
      e.desconto = preco > 0 && valor ? this.arredondar((valor / preco) * 100) : 0;
    }
  }

  /** Desconto em reais conforme o que está digitado no modal. */
  get valorDesconto(): number {
    const e = this.edicao;
    if (!e) return 0;
    const preco = e.precoVenda ?? 0;
    const desconto = e.desconto ?? 0;
    if (preco <= 0 || desconto <= 0) return 0;

    // Sempre a partir do % que vai para o backend: é o desconto que de fato será gravado.
    return this.arredondar((preco * this.percentualParaBackend(preco)) / 100);
  }

  /**
   * Desconto em R$ que não dá para gravar exato (o backend guarda % com 2 casas;
   * ex.: R$ 0,50 num produto de R$ 3.999). O resumo mostra o valor que vai valer.
   */
  get descontoAjustado(): boolean {
    const e = this.edicao;
    if (!e || e.tipoDesconto !== 'VALOR' || !e.desconto || !e.precoVenda) return false;
    return this.valorDesconto !== this.arredondar(Math.min(e.desconto, e.precoVenda));
  }

  get precoFinal(): number {
    return Math.max(0, (this.edicao?.precoVenda ?? 0) - this.valorDesconto);
  }

  /** Lucro por unidade com o que está no modal: preço final − custo. Null sem custo. */
  get lucroEdicao(): number | null {
    const custo = this.edicao?.precoCusto;
    return custo === null || custo === undefined ? null : this.arredondar(this.precoFinal - custo);
  }

  /** Mensagem de erro do formulário do modal (null = pode salvar). */
  get erroEdicao(): string | null {
    const e = this.edicao;
    if (!e) return null;
    if (e.quantidade === null || e.quantidade < 0 || !Number.isInteger(e.quantidade)) {
      return 'Informe uma quantidade inteira, 0 ou mais.';
    }
    if (e.precoVenda === null || e.precoVenda < 0) {
      return 'Informe um preço de venda válido.';
    }
    if (e.precoCusto !== null && e.precoCusto < 0) {
      return 'O preço de custo não pode ser negativo.';
    }
    if (e.estoqueMinimo !== null && (e.estoqueMinimo < 0 || !Number.isInteger(e.estoqueMinimo))) {
      return 'Informe um estoque mínimo inteiro, 0 ou mais.';
    }
    const desconto = e.desconto ?? 0;
    if (desconto < 0) return 'O desconto não pode ser negativo.';
    if (e.tipoDesconto === 'PERCENTUAL' && desconto > 100) return 'O desconto vai de 0% a 100%.';
    if (e.tipoDesconto === 'VALOR' && desconto > e.precoVenda) return 'O desconto não pode ser maior que o preço.';
    return null;
  }

  salvarEdicao() {
    const e = this.edicao;
    if (!e || this.salvando) return;

    if (!e.item.variacaoId) {
      Swal.fire('Erro', 'Não foi possível identificar a variação deste item.', 'error');
      return;
    }

    if (this.erroEdicao) {
      Swal.fire('Atenção', this.erroEdicao, 'warning');
      return;
    }

    const p = e.item;
    const quantidade = e.quantidade!;
    const precoVenda = e.precoVenda!;
    const percentual = this.percentualParaBackend(precoVenda);

    // Campo opcional apagado vai como null = backend mantém o valor atual.
    const mudouCusto = e.precoCusto !== null && e.precoCusto !== p.precoCusto;
    const mudouMinimo = e.estoqueMinimo !== null && e.estoqueMinimo !== p.estoqueMinimo;
    const mudouCatalogo = e.mostrarNoCatalogo !== p.mostrarNoCatalogo;
    const mudouEstoque =
      quantidade !== p.quantidade || precoVenda !== p.precoVenda || mudouCusto || mudouMinimo || mudouCatalogo;
    const mudouDesconto = percentual !== (Number(p.percentualDesconto) || 0);

    if (!mudouEstoque && !mudouDesconto) {
      this.edicao = null;
      return;
    }

    // O estoque vai primeiro: o percentual foi calculado sobre o preço novo.
    const passos: Observable<unknown> = (mudouEstoque
      ? this.estoqueService.atualizarEstoque({
          // O PATCH chama o campo de produtoId, mas o estoque e identificado
          // no backend pela variacao cadastrada para a loja.
          produtoId: p.variacaoId,
          lojaID: p.lojaId,
          quantidade,
          precoVenda,
          precoCusto: mudouCusto ? e.precoCusto : null,
          estoqueMinimo: mudouMinimo ? e.estoqueMinimo : null,
          mostrarNoCatalogo: mudouCatalogo ? e.mostrarNoCatalogo : null
        })
      : of(null)
    ).pipe(
      switchMap(() => mudouDesconto
        ? this.estoqueService.aplicarPromocao({ lojaId: p.lojaId, produtoId: p.variacaoId, percentual })
        : of(null))
    );

    this.salvando = true;
    passos.subscribe({
      next: () => {
        this.salvando = false;
        this.edicao = null;
        this.cdr.detectChanges();
        Swal.fire('Atualizado!', 'As alterações foram salvas.', 'success');
        this.carregarDados(this.paginaAtualEstoque);
      },
      error: (err) => {
        console.error('Erro ao atualizar estoque', err);
        this.salvando = false;
        this.cdr.detectChanges();
        Swal.fire('Erro', err?.error?.message || 'Não foi possível salvar as alterações.', 'error');
        // Se a quantidade/preço salvou e só o desconto falhou, a tabela já mostra o que ficou gravado.
        this.carregarDados(this.paginaAtualEstoque);
      }
    });
  }

  /**
   * O backend só guarda o desconto em % (2 casas). Para desconto em R$, procura o
   * percentual que, com o arredondamento do backend, dá exatamente o valor digitado.
   */
  private percentualParaBackend(preco: number): number {
    const e = this.edicao!;
    const desconto = e.desconto ?? 0;
    if (preco <= 0 || desconto <= 0) return 0;

    if (e.tipoDesconto === 'PERCENTUAL') {
      return this.arredondar(Math.min(desconto, 100));
    }

    const alvo = this.arredondar(Math.min(desconto, preco));
    const base = this.arredondar((alvo / preco) * 100);
    const candidatos = [base, base - 0.01, base + 0.01, base - 0.02, base + 0.02]
      .map(c => this.arredondar(Math.min(100, Math.max(0, c))));

    const exato = candidatos.find(c => this.arredondar((preco * c) / 100) === alvo);
    return exato ?? base;
  }

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private normalizarTexto(valor?: string) {
    return (valor ?? '').trim().toLocaleLowerCase('pt-BR');
  }
}
