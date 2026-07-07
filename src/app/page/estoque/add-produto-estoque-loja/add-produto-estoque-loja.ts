import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EstoqueService, EstoqueRequest } from '../../../service/estoque.service';
import { ProductService, Product, ProdutoVariacao } from '../../../service/product.service';
import { LojaService, Loja } from '../../../service/loja/loja.service';

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
export class AddProdutoEstoqueLoja implements OnInit {

  produtos: Product[] = [];
  lojas: Loja[] = [];

  produtoSelecionado?: Product;
  variacaoSelecionada?: ProdutoVariacao;
  lojaSelecionada?: Loja;
  carregandoVariacoes = false;

  buscaProduto = '';
  quantidade = 0;
  precoVenda = 0;
  percentualDesconto = 0;

  constructor(
    private produtoService: ProductService,
    private lojaService: LojaService,
    private estoqueService: EstoqueService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarLojas();
  }

  carregarProdutos() {
    this.produtoService
      .loadProducts()
      .subscribe(response => {
        this.produtos = response.content;
        this.cdr.detectChanges();
      });
  }

  carregarLojas() {
    this.lojaService.listar().subscribe(response => {
      this.lojas = response.content;
      this.cdr.detectChanges();
    });
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

  produtosFiltrados(): Product[] {
    if (!this.buscaProduto) {
      return this.produtos;
    }

    return this.produtos.filter((p: Product) =>
      p.name.toLowerCase().includes(this.buscaProduto.toLowerCase())
    );
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
