import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NavbarAdministradorComponent } from "../../../../shared/navbar-administrador/navbar-administrador";
import { CategoriaService, Categoria } from '../../../../service/categoria.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-add-edit-cartegoria',
  standalone: true,
  imports: [NavbarAdministradorComponent, CommonModule, FormsModule, SidebarComponent],
  templateUrl: './add-edit-cartegoria.html',
  styleUrl: './add-edit-cartegoria.css',
})
export class AddEditCartegoria implements OnInit {

  categorias: Categoria[] = [];
  nomeCategoria: string = '';
  editandoId: number | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef,
    private router: Router   // ✅ força atualização da view
  ) {}

  ngOnInit() {
    this.carregarCategorias();
  }

  carregarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias = [...data]; // ✅ spread cria novo array, Angular detecta a mudança
        this.cdr.detectChanges();   // ✅ força a view atualizar
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        Swal.fire('Erro', 'Não foi possível carregar as categorias', 'error');
      }
    });
  }

  salvar() {
    if (!this.nomeCategoria.trim()) {
      Swal.fire('Erro', 'Digite o nome da categoria', 'warning');
      return;
    }

    if (this.editandoId) {
      this.categoriaService.atualizar(this.editandoId, this.nomeCategoria)
        .subscribe({
          next: () => {
            Swal.fire('Atualizado!', 'Categoria atualizada.', 'success');
            this.resetForm();
            this.carregarCategorias();
          },
          error: (err) => {
            console.error('Erro ao atualizar:', err);
            Swal.fire('Erro', 'Não foi possível atualizar a categoria', 'error');
          }
        });
    } else {
      this.categoriaService.criar(this.nomeCategoria)
        .subscribe({
          next: () => {
            Swal.fire('Criado!', 'Categoria criada.', 'success');
            this.resetForm();
            this.carregarCategorias();
          },
          error: (err) => {
            console.error('Erro ao criar:', err);
            Swal.fire('Erro', 'Não foi possível criar a categoria', 'error');
          }
        });
    }
  }

  editar(cat: Categoria) {
    this.nomeCategoria = cat.nomeCategoria;
    this.editandoId = cat.id;
    this.cdr.detectChanges();
  }

deletar(id: number) {
  Swal.fire({
    title: 'Tem certeza?',
    text: 'Essa categoria será removida do sistema.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e53935',
    cancelButtonColor: '#6c757d',
    reverseButtons: true
  }).then((result) => {

    if (result.isConfirmed) {

      this.categoriaService.deletar(id).subscribe({

        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Categoria removida!',
            text: 'A categoria foi excluída com sucesso.',
            confirmButtonColor: '#198754'
          });

          this.carregarCategorias();
        },

error: (err) => {

  const mensagem =
    typeof err.error === 'string'
      ? err.error
      : 'Essa categoria possui produtos vinculados e não pode ser removida.';

  Swal.fire({
    icon: 'info',
    title: 'Não foi possível excluir',
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

    }

  });
}


  resetForm() {
    this.nomeCategoria = '';
    this.editandoId = null;
    this.cdr.detectChanges();
  }
}