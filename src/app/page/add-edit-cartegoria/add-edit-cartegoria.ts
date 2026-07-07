import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CategoriaService, Categoria, CategoriaRequest } from '../../service/categoria.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-edit-cartegoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-edit-cartegoria.html',
  styleUrl: './add-edit-cartegoria.css',
})
export class AddEditCartegoria implements OnInit {

  categorias: Categoria[] = [];
  categoriasPai: Categoria[] = [];

  nomeCategoria = '';
  descricao = '';
  categoriaPaiId: number | null = null;
  editandoId: number | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarCategorias();
  }

  carregarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias = [...data];
        this.categoriasPai = this.categorias.filter(c => !this.obterCategoriaPaiId(c));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        Swal.fire('Erro', 'Nao foi possivel carregar as categorias', 'error');
      }
    });
  }

  salvar() {
    if (!this.nomeCategoria.trim()) {
      Swal.fire('Erro', 'Digite o nome da categoria', 'warning');
      return;
    }

    const categoria = this.montarPayload();

    if (this.editandoId) {
      this.categoriaService.atualizar(this.editandoId, categoria)
        .subscribe({
          next: () => {
            Swal.fire('Atualizado!', 'Categoria atualizada.', 'success');
            this.resetForm();
            this.carregarCategorias();
          },
          error: (err) => {
            console.error('Erro ao atualizar:', err);
            Swal.fire('Erro', 'Nao foi possivel atualizar a categoria', 'error');
          }
        });
    } else {
      this.categoriaService.criar(categoria)
        .subscribe({
          next: () => {
            Swal.fire('Criado!', 'Categoria criada.', 'success');
            this.resetForm();
            this.carregarCategorias();
          },
          error: (err) => {
            console.error('Erro ao criar:', err);
            Swal.fire('Erro', 'Nao foi possivel criar a categoria', 'error');
          }
        });
    }
  }

  editar(cat: Categoria) {
    this.nomeCategoria = cat.nomeCategoria;
    this.descricao = cat.descricao ?? '';
    this.categoriaPaiId = this.obterCategoriaPaiId(cat);
    this.editandoId = cat.id;
    this.cdr.detectChanges();
  }

  deletar(id: number) {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Essa categoria sera removida do sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53935',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.categoriaService.deletar(id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Categoria removida!',
            text: 'A categoria foi excluida com sucesso.',
            confirmButtonColor: '#198754'
          });

          this.carregarCategorias();
        },
        error: (err) => {
          const mensagem =
            typeof err.error === 'string'
              ? err.error
              : 'Essa categoria possui produtos vinculados e nao pode ser removida.';

          Swal.fire({
            icon: 'info',
            title: 'Nao foi possivel excluir',
            text: mensagem,
            confirmButtonText: 'Ver produtos',
            confirmButtonColor: '#0d6efd',
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigateByUrl('/products');
            }
          });
        }
      });
    });
  }

  resetForm() {
    this.nomeCategoria = '';
    this.descricao = '';
    this.categoriaPaiId = null;
    this.editandoId = null;
    this.cdr.detectChanges();
  }

  obterCategoriaPaiId(cat: Categoria): number | null {
    return cat.categoriaPaiId ?? cat.categoriaPai?.id ?? null;
  }

  nomeCategoriaPai(cat: Categoria): string {
    const categoriaPaiId = this.obterCategoriaPaiId(cat);

    if (!categoriaPaiId) {
      return 'Principal';
    }

    return this.categorias.find(c => c.id === categoriaPaiId)?.nomeCategoria ?? 'Subcategoria';
  }

  private montarPayload(): CategoriaRequest {
    return {
      nomeCategoria: this.nomeCategoria.trim(),
      descricao: this.descricao.trim() || undefined,
      categoriaPaiId: this.categoriaPaiId || null
    };
  }
}
