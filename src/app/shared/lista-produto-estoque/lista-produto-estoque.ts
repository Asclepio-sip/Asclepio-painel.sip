import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CartService } from '../../service/cart.service';
import { Estoque } from '../../service/estoque.service';
import { Loja } from '../../service/loja/loja.service';
import { PedidosService } from '../../service/pedidos.service';

@Component({
  selector: 'app-lista-produto-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-produto-estoque.html',
  styleUrl: './lista-produto-estoque.css',
})
export class ListaProdutoEstoque implements OnInit {
  produtos: Estoque[] = [];
  lojas: Loja[] = [];

  buscaProduto = '';
  lojaSelecionadaId: number | null = null;
  lojaSessaoId: number | null = null;
  /**
   * Trava na loja da sessao (token). So fica destravado quando o usuario
   * escolheu "ver todas as lojas" no login (lojaId null no token) — trocar
   * de loja dentro do sistema exige deslogar e escolher outra no login.
   */
  travadoNaLoja = false;
  carregando = false;
  erro = '';

  constructor(
    private pedidosService: PedidosService,
    private cartService: CartService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.lojaSessaoId = this.authService.getLojaId();
    this.travadoNaLoja = this.lojaSessaoId !== null;
    this.lojaSelecionadaId = this.lojaSessaoId;

    if (!this.travadoNaLoja) {
      this.carregarLojas();
    }

    this.carregarProdutos();
  }

  carregarLojas() {
    this.pedidosService.listarLojas(0, 1000).subscribe({
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

    // Funcionario travado sempre usa a loja da sessao, mesmo que lojaSelecionadaId seja adulterado.
    const lojaId = this.travadoNaLoja ? this.lojaSessaoId! : (this.lojaSelecionadaId ?? undefined);

    this.pedidosService.relatorioEstoque(lojaId).subscribe({
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

    if (!this.travadoNaLoja) {
      this.lojaSelecionadaId = null;
    }

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
