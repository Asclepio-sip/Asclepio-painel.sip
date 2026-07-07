import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../service/cart.service';
import { Estoque, EstoqueService } from '../../service/estoque.service';
import { Loja, LojaService } from '../../service/loja/loja.service';

@Component({
  selector: 'app-lista-produto-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-produto-estoque.html',
  styleUrl: './lista-produto-estoque.css',
})
export class ListaProdutoEstoque implements OnInit {
  produtos: Estoque[] = [];
  lojas: Loja[] = [];

  buscaProduto = '';
  lojaSelecionadaId: number | null = null;
  carregando = false;
  erro = '';

  constructor(
    private estoqueService: EstoqueService,
    private lojaService: LojaService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarLojas();
    this.carregarProdutos();
  }

  carregarLojas() {
    this.lojaService.listar(0, 1000).subscribe({
      next: response => {
        this.lojas = response.content;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erro ao carregar lojas', err);
      }
    });
  }

  carregarProdutos() {
    this.carregando = true;
    this.erro = '';

    const lojaId = this.lojaSelecionadaId ?? undefined;

    this.estoqueService.filtrar(lojaId).subscribe({
      next: produtos => {
        this.produtos = produtos.filter(produto => produto.quantidade > 0);
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erro ao carregar produtos em estoque', err);
        this.erro = 'Nao foi possivel carregar os produtos disponiveis.';
        this.produtos = [];
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  limparFiltros() {
    this.buscaProduto = '';
    this.lojaSelecionadaId = null;
    this.carregarProdutos();
  }

  produtosFiltrados(): Estoque[] {
    const termo = this.buscaProduto.trim().toLowerCase();

    if (!termo) {
      return this.produtos;
    }

    return this.produtos.filter(produto =>
      [
        produto.nomeProduto,
        produto.nomeVariacao,
        produto.nomeLoja,
        produto.Entregar
      ]
        .filter(Boolean)
        .some(valor => valor.toLowerCase().includes(termo))
    );
  }

  adicionar(produto: Estoque) {
    this.cartService.add(produto);
  }

  imagemProduto(produto: Estoque) {
    if (produto.imagemUrl) {
      return produto.imagemUrl;
    }

    if (produto.imagemBase64) {
      return `data:image/png;base64,${produto.imagemBase64}`;
    }

    return 'assets/sem-imagem.png';
  }
}
