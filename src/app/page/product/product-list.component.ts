import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Product, ProductService } from '../../service/product.service';
import { Categoria, CategoriaService } from '../../service/categoria.service';
import { NavbarAdministradorComponent } from "../../shared/navbar-administrador/navbar-administrador";

const TAMANHO_MAXIMO_IMAGEM = 15 * 1024 * 1024;

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.produtoService.getCategoriasProdutos().subscribe({
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

  onFiltroCategoriaChange(categoriaId: number | null) {
    this.router.navigate(['/products'], {
      queryParams: { categoriaId: categoriaId ?? null }
    });
  }

  nomeCategoriaCompleto(categoria: Categoria): string {
    return categoria.nomeCategoriaPai
      ? `${categoria.nomeCategoriaPai} / ${categoria.nomeCategoria}`
      : categoria.nomeCategoria;
  }

  nomeCategoriaProduto(p: Product): string {
    if (p.categoria) {
      return this.nomeCategoriaCompleto(p.categoria);
    }
    if (p.categoriaNome) {
      return p.categoriaNome;
    }
    return p.categoriaId ? `Categoria #${p.categoriaId}` : '';
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

  editarNome(produto: Product) {
    Swal.fire({
      title: 'Editar nome do produto',
      input: 'text',
      inputLabel: 'Nome do produto',
      inputValue: produto.name,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#C5794E',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Digite o nome do produto';
        }
        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;

      const novoNome = result.value.trim();
      if (novoNome === produto.name) return;

      this.produtoService.updateProduct(produto.id, { name: novoNome }).subscribe({
        next: () => {
          produto.name = novoNome;
          this.cdr.detectChanges();
          Swal.fire('Sucesso', 'Nome do produto atualizado!', 'success');
        },
        error: err => {
          console.error('Erro ao atualizar nome do produto', err);
          Swal.fire('Erro', 'Não foi possível atualizar o nome do produto.', 'error');
        }
      });
    });
  }

  editarCategoria(produto: Product) {
    const categoriaAtual = produto.categoriaNome || produto.categoria?.nomeCategoria || '';

    const opcoesHtml = this.categorias
      .map(cat => {
        const nome = this.escapeHtml(cat.nomeCategoria);
        const label = this.escapeHtml(this.nomeCategoriaCompleto(cat));
        return `<option value="${nome}">${label}</option>`;
      })
      .join('');

    Swal.fire({
      title: 'Editar categoria do produto',
      html: `
        <div style="text-align:left; margin-top:6px;">
          <label for="swal-categoria-select" style="display:block; font-family:'Poppins',sans-serif; font-size:12.5px; font-weight:600; color:#374151; margin-bottom:6px;">Categoria</label>
          <div style="display:flex; gap:8px; align-items:stretch;">
            <select id="swal-categoria-select" style="flex:1; min-width:0; height:42px; padding:0 12px; border:1.5px solid #e5e7eb; border-radius:8px; font-family:'Poppins',sans-serif; font-size:14px; color:#111827; background:#fff;">
              ${opcoesHtml}
            </select>
            <button type="button" id="swal-nova-categoria-btn" title="Nova categoria" style="width:42px; height:42px; flex-shrink:0; border:none; background:#111827; color:#fff; border-radius:8px; font-size:20px; font-weight:700; cursor:pointer; line-height:1;">+</button>
          </div>
        </div>
      `,
      didOpen: () => {
        const select = document.getElementById('swal-categoria-select') as HTMLSelectElement;
        select.value = categoriaAtual;

        document.getElementById('swal-nova-categoria-btn')?.addEventListener('click', () => {
          this.criarCategoriaEEditarProduto(produto);
        });
      },
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#C5794E',
      preConfirm: () => {
        const select = document.getElementById('swal-categoria-select') as HTMLSelectElement;

        if (!select.value) {
          Swal.showValidationMessage('Selecione uma categoria');
          return;
        }

        return select.value;
      }
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;

      this.salvarCategoriaProduto(produto, result.value as string);
    });
  }

  private escapeHtml(texto: string): string {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  private criarCategoriaEEditarProduto(produto: Product) {
    Swal.fire({
      title: 'Nova categoria',
      input: 'text',
      inputLabel: 'Nome da categoria',
      inputPlaceholder: 'Ex: Higiene Pessoal',
      showCancelButton: true,
      confirmButtonText: 'Criar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#C5794E',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Digite o nome da categoria';
        }
        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed || !result.value) {
        this.editarCategoria(produto);
        return;
      }

      const nomeCategoria = result.value.trim();

      this.categoriaService.criar({ nomeCategoria }).subscribe({
        next: () => {
          this.produtoService.getCategoriasProdutos().subscribe({
            next: cats => {
              this.categorias = cats;
              this.cdr.detectChanges();
              this.salvarCategoriaProduto(produto, nomeCategoria);
            }
          });
        },
        error: err => {
          console.error('Erro ao criar categoria', err);
          Swal.fire('Erro', 'Não foi possível criar a categoria.', 'error');
        }
      });
    });
  }

  private salvarCategoriaProduto(produto: Product, categoriaNome: string) {
    this.produtoService.updateProduct(produto.id, { categoriaNome }).subscribe({
      next: () => {
        const categoria = this.categorias.find(c => c.nomeCategoria === categoriaNome);
        produto.categoria = categoria;
        produto.categoriaNome = categoriaNome;
        produto.categoriaId = categoria?.id;
        this.cdr.detectChanges();
        Swal.fire('Sucesso', 'Categoria do produto atualizada!', 'success');
      },
      error: err => {
        console.error('Erro ao atualizar categoria do produto', err);
        Swal.fire('Erro', 'Não foi possível atualizar a categoria do produto.', 'error');
      }
    });
  }

  trocarImagem(produto: Product, input: HTMLInputElement) {
    const arquivo = input.files?.[0];
    input.value = '';

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith('image/')) {
      Swal.fire('Atenção', 'Selecione um arquivo de imagem valido.', 'warning');
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
      Swal.fire('Atenção', 'A imagem enviada é muito grande. Envie um arquivo de até 15MB.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Atualizando imagem...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.produtoService.atualizarImagem(produto.id, arquivo).subscribe({
      next: produtoAtualizado => {
        produto.imagemUrl = produtoAtualizado.imagemUrl;
        this.cdr.detectChanges();
        Swal.fire('Sucesso', 'Imagem do produto atualizada!', 'success');
      },
      error: err => {
        console.error('Erro ao atualizar imagem do produto', err);
        Swal.fire('Erro', 'Não foi possível atualizar a imagem do produto.', 'error');
      }
    });
  }
}
