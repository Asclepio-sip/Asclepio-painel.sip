import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LojaService, Loja } from '../../../service/loja/loja.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-editar-loja',
  standalone: true,
imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editar-loja.html',
  styleUrls: ['./editar-loja.css'],
})
export class EditarLoja implements OnInit {

  

  id!: number;

loja: Loja = {
  nomeLoja: '',
  cep: '',
  cnpj: '',
  telefone: '',
  textoDescricao: '',
  tipoAtendimento: '',
  valorMinimoFreteGratis: 0,
  imagemUrl: '' 
};

  modoEdicao = false; // ðŸ‘ˆ controla se pode editar

constructor(
  private route: ActivatedRoute,
  private router: Router,
  private lojaService: LojaService,
  private cdr: ChangeDetectorRef
) {}
  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarLoja();
  }

carregarLoja() {
  this.lojaService.buscarPorId(this.id).subscribe({
    next: (dados) => {
      this.loja = dados;

      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error(err);
      Swal.fire('Erro', 'Não foi possível carregar a loja.', 'error');
    }
  });
}
  ativarEdicao() {
    this.modoEdicao = true;
  }

  salvar() {
    this.lojaService.atualizar(this.id, this.loja).subscribe({
      next: () => {
        Swal.fire('Sucesso', 'Loja atualizada com sucesso!', 'success').then(() => {
          this.router.navigate(['/loja']);
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Erro', 'Não foi possível atualizar a loja.', 'error');
      }
    });
  }

  get entregaAtiva(): boolean {
    return this.loja.tipoAtendimento === 'ENTREGA' || this.loja.tipoAtendimento === 'AMBOS';
  }

  get retiradaAtiva(): boolean {
    return this.loja.tipoAtendimento === 'RETIRADA' || this.loja.tipoAtendimento === 'AMBOS';
  }

  toggleEntrega() {
    this.aplicarTipoAtendimento(!this.entregaAtiva, this.retiradaAtiva);
  }

  toggleRetirada() {
    this.aplicarTipoAtendimento(this.entregaAtiva, !this.retiradaAtiva);
  }

  private aplicarTipoAtendimento(entrega: boolean, retirada: boolean) {
    if (!entrega && !retirada) {
      Swal.fire('Atenção', 'A loja precisa ter pelo menos um tipo de atendimento ativo.', 'warning');
      return;
    }

    const tipoAtendimento = entrega && retirada ? 'AMBOS' : entrega ? 'ENTREGA' : 'RETIRADA';

    if (tipoAtendimento === this.loja.tipoAtendimento) {
      return;
    }

    const atualizado: Loja = { ...this.loja, tipoAtendimento };

    this.lojaService.atualizar(this.id, atualizado).subscribe({
      next: () => {
        this.loja = atualizado;
        this.cdr.detectChanges();
        Swal.fire('Sucesso', 'Tipo de atendimento atualizado!', 'success');
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Erro', 'Não foi possível atualizar o tipo de atendimento da loja.', 'error');
      }
    });
  }

  cancelar() {
    this.router.navigate(['/loja']);
  }
}
