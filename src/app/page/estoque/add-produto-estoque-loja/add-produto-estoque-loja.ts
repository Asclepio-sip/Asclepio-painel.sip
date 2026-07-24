import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EstoqueService, EstoqueRequest, EstoqueLoja } from '../../../service/estoque.service';
import { ProductService, Product, ProdutoVariacao } from '../../../service/product.service';

@Component({
  selector: 'app-add-produto-estoque-loja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './add-produto-estoque-loja.html',
  styleUrls: ['./add-produto-estoque-loja.css']
})
export class AddProdutoEstoqueLoja implements OnInit, OnDestroy {

  produtos: Product[] = [];
  lojas: EstoqueLoja[] = [];

  produtoSelecionado?: Product;
  variacaoSelecionada?: ProdutoVariacao;
  lojaSelecionada?: EstoqueLoja;
  carregandoVariacoes = false;
  carregandoProdutos = false;

  buscaProduto = '';
  quantidade = 0;
  precoVenda = 0;
  percentualDesconto = 0;

  paginaAtual = 0;
  totalPaginas = 0;
  totalElementos = 0;
  tamanhoPagina = 20;

  private buscaTimeout: any;

  constructor(
    private produtoService: ProductService,
    private estoqueService: EstoqueService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarLojas();
  }

  ngOnDestroy(): void {
    clearTimeout(this.buscaTimeout);
  }

  carregarProdutos(page: number = 0) {
    this.carregandoProdutos = true;

    this.produtoService
      .loadProdutosEstoque(page, this.tamanhoPagina, {
        nome: this.buscaProduto.trim() || undefined
      })
      .subscribe({
        next: response => {
          this.produtos = response.content;
          this.paginaAtual = response.page?.number ?? response.number ?? page;
          this.totalPaginas = response.page?.totalPages ?? response.totalPages ?? 0;
          this.totalElementos = response.page?.totalElements ?? response.totalElements ?? response.content.length;
          this.carregandoProdutos = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Erro ao carregar produtos', err);
          this.carregandoProdutos = false;
          this.cdr.detectChanges();
        }
      });
  }

  carregarLojas() {
    this.estoqueService.listarLojas().subscribe(response => {
      this.lojas = response.content;
      this.cdr.detectChanges();
    });
  }

  onBuscaProdutoChange() {
    clearTimeout(this.buscaTimeout);
    this.buscaTimeout = setTimeout(() => {
      this.carregarProdutos(0);
    }, 400);
  }

  onTamanhoPaginaChange() {
    this.carregarProdutos(0);
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

  irParaPagina(pagina: number) {
    if (pagina >= 0 && pagina < this.totalPaginas && pagina !== this.paginaAtual) {
      this.carregarProdutos(pagina);
    }
  }

  get paginasVisiveis(): number[] {
    const janela = 5;
    const metade = Math.floor(janela / 2);
    let inicio = Math.max(0, this.paginaAtual - metade);
    const fim = Math.min(this.totalPaginas - 1, inicio + janela - 1);
    inicio = Math.max(0, fim - janela + 1);

    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  }

  selecionarProduto(produto: Product) {
    this.produtoSelecionado = {
      ...produto,
      variacoes: []
    };
    this.variacaoSelecionada = undefined;
    this.carregandoVariacoes = true;

    this.produtoService.listarVariacoes(produto.id).subscribe({
      next: variacoes => {
        this.produtoSelecionado = {
          ...produto,
          variacoes
        };
        this.carregandoVariacoes = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erro ao carregar variacoes do produto', err);
        this.carregandoVariacoes = false;
        alert('Erro ao carregar as variacoes do produto');
        this.cdr.detectChanges();
      }
    });
  }

  salvar() {
    if (!this.lojaSelecionada) {
      alert('Selecione uma loja');
      return;
    }

    if (!this.produtoSelecionado) {
      alert('Selecione um produto');
      return;
    }

    if (!this.variacaoSelecionada) {
      alert('Selecione uma variacao');
      return;
    }

    if (!this.quantidade || !this.precoVenda) {
      alert('Informe quantidade e preco');
      return;
    }

    const data: EstoqueRequest = {
      produtoId: this.produtoSelecionado.id,
      variacaoId: this.variacaoSelecionada.id,
      lojaID: this.lojaSelecionada.id!,
      nomeLoja: this.lojaSelecionada.nomeLoja,
      nomeProduto: this.produtoSelecionado.name,
      quantidade: this.quantidade,
      precoVenda: this.precoVenda,
      percentualDesconto: this.percentualDesconto || 0
    };

    this.estoqueService.salvar(data).subscribe({
      next: () => {
        alert('Estoque cadastrado!');
        this.resetForm();
      },
      error: err => {
        console.error('Erro ao cadastrar estoque', err);
        alert('Erro ao cadastrar estoque');
      }
    });
  }

  resetForm() {
    this.variacaoSelecionada = undefined;
    this.quantidade = 0;
    this.precoVenda = 0;
    this.percentualDesconto = 0;
  }
}
