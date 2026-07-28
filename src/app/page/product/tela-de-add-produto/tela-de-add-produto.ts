import { Component, OnInit, ViewEncapsulation, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { ProductService } from '../../../service/product.service';
import { CategoriaService } from '../../../service/categoria.service';
import { EstoqueService, EstoqueLoja } from '../../../service/estoque.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-tela-de-add-produto',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './tela-de-add-produto.html',
  styleUrl: './tela-de-add-produto.css',
})
export class TelaDeAddProduto implements OnInit {

  readonly limiteDescricao = 3000;

  name = '';
  descricao = '';
  marca = '';
  categoriaSelecionada = '';
  categoriaId: number | null = null;
  categorias: any[] = [];

  imagemFile: File | null = null;
  previewImagem = '';

  dropdownAberto = false;

  nomeVariacao = '';
  codigoBarras = '';
  lojaId: number | null = null;
  quantidade: number | null = null;
  precoVenda: number | null = null;
  lojas: EstoqueLoja[] = [];

  readonly totalCamposObrigatorios = 6;

  constructor(
    private productService: ProductService,
    private categoriaService: CategoriaService,
    private estoqueService: EstoqueService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.carregarCategorias();
    this.carregarLojas();
  }

  private carregarLojas() {
    this.estoqueService.listarLojas().subscribe({
      next: response => this.lojas = response.content,
      error: () => {
        Swal.fire('Erro', 'Erro ao carregar lojas', 'error');
      }
    });
  }

  get camposPreenchidos(): number {
    return (
      (this.name.trim() ? 1 : 0) +
      (this.imagemFile ? 1 : 0) +
      (this.nomeVariacao.trim() ? 1 : 0) +
      (this.lojaId ? 1 : 0) +
      (this.quantidade && this.quantidade > 0 ? 1 : 0) +
      (this.precoVenda && this.precoVenda > 0 ? 1 : 0)
    );
  }

  private carregarCategorias() {
    this.productService.getCategoriasComId().subscribe({
      next: cats => this.categorias = cats,
      error: () => {
        Swal.fire('Erro', 'Erro ao carregar categorias', 'error');
      }
    });
  }

  novaCategoria() {
    this.dropdownAberto = false;

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
      if (!result.isConfirmed || !result.value) return;

      this.categoriaService.criar({ nomeCategoria: result.value.trim() }).subscribe({
        next: (categoria: any) => {
          Swal.fire('Sucesso', 'Categoria criada!', 'success');
          this.productService.getCategoriasComId().subscribe({
            next: cats => {
              this.categorias = cats;
              const criada = categoria?.id
                ? this.categorias.find(c => c.id === categoria.id)
                : this.categorias.find(c => c.nomeCategoria === result.value.trim());
              if (criada) this.selecionarCategoria(criada);
            }
          });
        },
        error: () => {
          Swal.fire('Erro', 'Nao foi possivel criar a categoria', 'error');
        }
      });
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.processarImagem(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.processarImagem(file);
    }
  }

  private processarImagem(file: File) {
    this.imagemFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImagem = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  toggleDropdown() {
    this.dropdownAberto = !this.dropdownAberto;
  }

  selecionarCategoria(cat: any) {
    this.categoriaSelecionada = cat.nomeCategoriaPai
      ? `${cat.nomeCategoriaPai} / ${cat.nomeCategoria}`
      : cat.nomeCategoria;
    this.categoriaId = cat.id;
    this.dropdownAberto = false;
  }

  limparCategoria() {
    this.categoriaSelecionada = '';
    this.categoriaId = null;
    this.dropdownAberto = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownAberto = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.dropdownAberto = false;
  }

  salvar() {
    if (!this.name.trim() || !this.imagemFile) {
      Swal.fire('Atencao', 'Preencha todos os campos obrigatorios.', 'warning');
      return;
    }

    if (this.descricao.length > this.limiteDescricao) {
      Swal.fire(
        'Descrição muito longa',
        `A descrição deve ter no máximo ${this.limiteDescricao} caracteres.`,
        'warning'
      );
      return;
    }

    if (!this.nomeVariacao.trim() || !this.lojaId || !this.quantidade || !this.precoVenda) {
      Swal.fire('Atencao', 'Preencha os dados de estoque (variacao, loja, quantidade e preco).', 'warning');
      return;
    }

    this.productService.criarProdutoCompleto({
      nome: this.name.trim(),
      descricao: this.descricao.trim(),
      marca: this.marca.trim(),
      categoriaId: this.categoriaId,
      imagem: this.imagemFile!,
      nomeVariacao: this.nomeVariacao.trim(),
      codigoBarras: this.codigoBarras.trim(),
      lojaId: this.lojaId,
      quantidade: this.quantidade,
      precoVenda: this.precoVenda
    }).subscribe({
      next: () => {
        Swal.fire('Sucesso', 'Produto e estoque cadastrados!', 'success')
          .then(() => {
            this.router.navigate(['/products']);
          });
      },
      error: () => {
        Swal.fire('Erro', 'Erro ao salvar produto.', 'error');
      }
    });
  }
}
