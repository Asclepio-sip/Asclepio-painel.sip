import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { Product, ProdutoVariacao, ProductService } from '../../../service/product.service';

@Component({
  selector: 'app-produto-variacoes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './produto-variacoes.html',
  styleUrl: './produto-variacoes.css'
})
export class ProdutoVariacoes implements OnInit {
  produto?: Product;
  variacoes: ProdutoVariacao[] = [];
  produtoId = 0;

  nomeVariacao = '';
  codigoBarras = '';
  ativo = true;
  variacaoEditandoId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.produtoId = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarProduto();
    this.carregarVariacoes();
  }

  carregarProduto() {
    if (!this.produtoId) return;

    this.productService.buscarProdutoVariacaoPorId(this.produtoId).subscribe({
      next: produto => {
        this.produto = produto;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erro ao carregar produto', err);
        Swal.fire('Erro', 'Nao foi possivel carregar o produto.', 'error');
      }
    });
  }

  carregarVariacoes() {
    if (!this.produtoId) return;

    this.productService.listarVariacoes(this.produtoId).subscribe({
      next: variacoes => {
        this.variacoes = variacoes;

        if (this.produto) {
          this.produto = {
            ...this.produto,
            variacoes
          };
        }

        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erro ao carregar variacoes', err);
        Swal.fire('Erro', 'Nao foi possivel carregar as variacoes.', 'error');
      }
    });
  }

  salvar() {
    if (!this.nomeVariacao.trim()) {
      Swal.fire('Atencao', 'Digite o nome da variacao.', 'warning');
      return;
    }

    if (this.variacaoEditandoId) {
      this.atualizarVariacao();
      return;
    }

    this.productService.addVariacao(this.produtoId, {
      nomeVariacao: this.nomeVariacao.trim(),
      codigoBarras: this.codigoBarras.trim() || undefined,
      ativo: this.ativo
    }).subscribe({
      next: () => {
        Swal.fire('Sucesso', 'Variacao cadastrada.', 'success');
        this.resetForm();
        this.carregarVariacoes();
      },
      error: err => {
        console.error('Erro ao salvar variacao', err);
        Swal.fire('Erro', 'Nao foi possivel salvar a variacao.', 'error');
      }
    });
  }

  editarVariacao(variacao: ProdutoVariacao) {
    this.variacaoEditandoId = variacao.id;
    this.nomeVariacao = variacao.nomeVariacao;
    this.codigoBarras = variacao.codigoBarras ?? '';
    this.ativo = variacao.ativo;
  }

  atualizarVariacao() {
    if (!this.variacaoEditandoId) return;

    this.productService.atualizarVariacao(this.variacaoEditandoId, {
      nomeVariacao: this.nomeVariacao.trim(),
      codigoBarras: this.codigoBarras.trim() || undefined,
      ativo: this.ativo
    }).subscribe({
      next: () => {
        Swal.fire('Sucesso', 'Variacao atualizada.', 'success');
        this.resetForm();
        this.carregarVariacoes();
      },
      error: err => {
        console.error('Erro ao atualizar variacao', err);
        Swal.fire('Erro', 'Nao foi possivel atualizar a variacao.', 'error');
      }
    });
  }

  cancelarEdicao() {
    this.resetForm();
  }

  resetForm() {
    this.nomeVariacao = '';
    this.codigoBarras = '';
    this.ativo = true;
    this.variacaoEditandoId = null;
  }
}
