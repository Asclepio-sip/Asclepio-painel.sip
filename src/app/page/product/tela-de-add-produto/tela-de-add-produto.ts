import { ChangeDetectorRef, Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { ProductService } from '../../../service/product.service';
import { CategoriaService } from '../../../service/categoria.service';
import { EstoqueService, EstoqueLoja } from '../../../service/estoque.service';

import { isWebp, webpParaPng } from '../../../shared/imagem/webp-para-png';

const TAMANHO_MAXIMO_IMAGEM = 15 * 1024 * 1024;

@Component({
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
  /** Arquivo sendo arrastado por cima da área da foto. */
  arrastando = false;

  dropdownAberto = false;

  nomeVariacao = '';
  codigoBarras = '';
  lojaId: number | null = null;
  quantidade: number | null = null;
  precoVenda: number | null = null;
  precoCusto: number | null = null;
  estoqueMinimo: number | null = null;
  mostrarNoCatalogo = true;
  lojas: EstoqueLoja[] = [];

  readonly totalCamposObrigatorios = 6;

  salvando = false;

  constructor(
    private productService: ProductService,
    private categoriaService: CategoriaService,
    private estoqueService: EstoqueService,
    private router: Router,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarCategorias();
    this.carregarLojas();
  }

  private carregarLojas() {
    this.estoqueService.listarLojas().subscribe({
      next: response => {
        this.lojas = response.content;
        this.cdr.detectChanges();
      },
      error: () => {
        Swal.fire('Erro', 'Erro ao carregar lojas', 'error');
      }
    });
  }

  /** "Foto do produto, Loja" — o que ainda falta, para a barra de salvar. */
  get faltando(): string {
    return this.pendencias.filter(item => !item.ok).map(item => item.label).join(', ');
  }

  /** Prévia do lucro (o backend calcula igual: venda − custo). Null sem custo ou sem preço. */
  get lucro(): number | null {
    if (this.precoCusto == null || !this.precoVenda) {
      return null;
    }
    return this.precoVenda - this.precoCusto;
  }

  get margemLucro(): number | null {
    const lucro = this.lucro;
    return lucro === null || !this.precoVenda ? null : (lucro / this.precoVenda) * 100;
  }

  get camposPreenchidos(): number {
    return this.pendencias.filter(item => item.ok).length;
  }

  private carregarCategorias() {
    this.productService.getCategoriasComId().subscribe({
      next: cats => {
        this.categorias = cats;
        this.cdr.detectChanges();
      },
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
      confirmButtonColor: '#008E51',
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
              this.cdr.detectChanges();
            }
          });
        },
        error: () => {
          Swal.fire('Erro', 'Não foi possível criar a categoria.', 'error');
        }
      });
    });
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processarImagem(file, input);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.arrastando = true;
  }

  onDragLeave() {
    this.arrastando = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.arrastando = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processarImagem(file);
  }

  private async processarImagem(file: File, input?: HTMLInputElement) {
    if (!file.type.startsWith('image/') && !isWebp(file)) {
      Swal.fire('Atenção', 'Selecione um arquivo de imagem válido.', 'warning');
      if (input) input.value = '';
      return;
    }

    if (file.size > TAMANHO_MAXIMO_IMAGEM) {
      Swal.fire('Atenção', 'A imagem enviada é muito grande. Envie um arquivo de até 15MB.', 'warning');
      if (input) input.value = '';
      return;
    }

    try {
      file = await webpParaPng(file);
    } catch {
      Swal.fire('Atenção', 'Não foi possível converter a imagem WebP. Tente outra imagem.', 'warning');
      if (input) input.value = '';
      return;
    }

    // O PNG convertido costuma ser maior que o WebP original
    if (file.size > TAMANHO_MAXIMO_IMAGEM) {
      Swal.fire('Atenção', 'A imagem convertida para PNG passou de 15MB. Envie uma imagem menor.', 'warning');
      if (input) input.value = '';
      return;
    }

    this.imagemFile = file;
    const reader = new FileReader();
    // O FileReader responde fora do Angular (app zoneless): sem o detectChanges a
    // prévia só aparecia depois de clicar em outra coisa na tela.
    reader.onload = (e: any) => {
      this.previewImagem = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removerImagem(input: HTMLInputElement) {
    this.imagemFile = null;
    this.previewImagem = '';
    input.value = '';
  }

  /** Itens obrigatórios para a lista de conferência ao lado do botão Salvar. */
  get pendencias(): { label: string; ok: boolean }[] {
    return [
      { label: 'Nome do produto', ok: !!this.name.trim() },
      { label: 'Foto do produto', ok: !!this.imagemFile },
      { label: 'Nome da variação', ok: !!this.nomeVariacao.trim() },
      { label: 'Loja', ok: !!this.lojaId },
      { label: 'Quantidade', ok: !!this.quantidade && this.quantidade > 0 },
      { label: 'Preço de venda', ok: !!this.precoVenda && this.precoVenda > 0 },
    ];
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
      Swal.fire('Atenção', 'Preencha o nome e envie a foto do produto.', 'warning');
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
      Swal.fire('Atenção', 'Preencha os dados de estoque (variação, loja, quantidade e preço).', 'warning');
      return;
    }

    if ((this.precoCusto != null && this.precoCusto < 0) || (this.estoqueMinimo != null && this.estoqueMinimo < 0)) {
      Swal.fire('Atenção', 'Preço de custo e estoque mínimo não podem ser negativos.', 'warning');
      return;
    }

    this.salvando = true;

    Swal.fire({
      title: 'Salvando produto...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

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
      precoVenda: this.precoVenda,
      precoCusto: this.precoCusto,
      estoqueMinimo: this.estoqueMinimo,
      mostrarNoCatalogo: this.mostrarNoCatalogo
    }).subscribe({
      next: () => {
        this.salvando = false;
        Swal.fire('Sucesso', 'Produto e estoque cadastrados!', 'success')
          .then(() => {
            this.router.navigate(['/products']);
          });
      },
      error: () => {
        this.salvando = false;
        this.cdr.detectChanges();
        Swal.fire('Erro', 'Erro ao salvar produto.', 'error');
      }
    });
  }
}
