import { Component, OnInit, ViewEncapsulation, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

import { ProductService } from '../../../service/product.service';
import { NavbarAdministradorComponent } from '../../../shared/navbar-administrador/navbar-administrador';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-tela-de-add-produto',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NavbarAdministradorComponent,
    RouterModule
  ],
  templateUrl: './tela-de-add-produto.html',
  styleUrl: './tela-de-add-produto.css',
})
export class TelaDeAddProduto implements OnInit {

  name!: string;
  categoriaSelecionada!: string;
  categorias: string[] = [];

  imagemBase64!: string;
  previewImagem!: string;

  dropdownAberto = false;

  variacoes: {
    nome: string;
    precoVenda: number;
  }[] = [
    { nome: '', precoVenda: 0 }
  ];

  constructor(
    private productService: ProductService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.productService.getCategorias().subscribe({
      next: cats => this.categorias = cats,
      error: () => {
        Swal.fire('Erro', 'Erro ao carregar categorias', 'error');
      }
    });
  }

  // =========================
  // Upload de imagem
  // =========================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.convertToBase64(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.convertToBase64(file);
    }
  }

 private convertToBase64(file: File) {

  const img = new Image();

  const reader = new FileReader();

  reader.onload = (e: any) => {

    img.src = e.target.result;

    img.onload = () => {

      const canvas = document.createElement('canvas');

      const MAX_WIDTH = 800;
      const scale = MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // CONVERTE PARA WEBP + COMPRESSÃO
      const webpBase64 = canvas.toDataURL('image/webp', 0.7);

      this.previewImagem = webpBase64;

      // remove "data:image/webp;base64,"
      this.imagemBase64 = webpBase64.split(',')[1];
    };
  };

  reader.readAsDataURL(file);
}
  // =========================
  // Dropdown categoria
  // =========================

  toggleDropdown() {
    this.dropdownAberto = !this.dropdownAberto;
  }

  selecionarCategoria(cat: string) {
    this.categoriaSelecionada = cat;
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

  // =========================
  // Variações
  // =========================

  adicionarVariacao() {
    this.variacoes.push({ nome: '', precoVenda: 0 });
  }

  removerVariacao(index: number) {
    if (this.variacoes.length > 1) {
      this.variacoes.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  // =========================
  // Salvar
  // =========================

  salvar() {

    if (!this.name?.trim() ||
        !this.categoriaSelecionada ||
        !this.imagemBase64) {

      Swal.fire('Atenção', 'Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    for (const v of this.variacoes) {
      if (!v.nome.trim() ) {
        Swal.fire('Erro', 'Preencha corretamente as variações.', 'warning');
        return;
      }
    }

    const requests = this.variacoes.map(v =>
      this.productService.addProduct({
        name: this.name.trim(),
        variacao: v.nome.trim(),
        categoriaNome: this.categoriaSelecionada,
        precoVenda: v.precoVenda,
        imagemBase64: this.imagemBase64
      })
    );

    forkJoin(requests).subscribe({
      next: () => {
        Swal.fire('Sucesso', 'Produto cadastrado!', 'success')
          .then(() => this.router.navigate(['/products']));
      },
      error: () => {
        Swal.fire('Erro', 'Erro ao salvar produto.', 'error');
      }
    });
  }
}