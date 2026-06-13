import { Component, OnInit, ViewEncapsulation, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

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

  name = '';
  categoriaSelecionada = '';
  categorias: string[] = [];

  imagemBase64 = '';
  previewImagem = '';

  dropdownAberto = false;

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
        const maxWidth = 800;
        const scale = maxWidth / img.width;

        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const webpBase64 = canvas.toDataURL('image/webp', 0.7);
        this.previewImagem = webpBase64;
        this.imagemBase64 = webpBase64.split(',')[1];
      };
    };

    reader.readAsDataURL(file);
  }

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

  salvar() {
    if (!this.name.trim() || !this.categoriaSelecionada || !this.imagemBase64) {
      Swal.fire('Atencao', 'Preencha todos os campos obrigatorios.', 'warning');
      return;
    }

    this.productService.addProduct({
      name: this.name.trim(),
      categoriaNome: this.categoriaSelecionada,
      imagemBase64: this.imagemBase64
    }).subscribe({
      next: (produto) => {
        Swal.fire('Sucesso', 'Produto cadastrado!', 'success')
          .then(() => {
            if (produto?.id) {
              this.router.navigate(['/products', produto.id, 'variacoes']);
              return;
            }

            this.router.navigate(['/variacoes']);
          });
      },
      error: () => {
        Swal.fire('Erro', 'Erro ao salvar produto.', 'error');
      }
    });
  }
}
