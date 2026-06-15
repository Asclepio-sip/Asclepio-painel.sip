import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LojaService, Loja } from '../../../service/loja/loja.service';
import { NavbarAdministradorComponent } from "../../../shared/navbar-administrador/navbar-administrador";
import { SidebarComponent } from "../../../shared/sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-editar-loja',
  standalone: true,
imports: [
  CommonModule,
  FormsModule,
  NavbarAdministradorComponent,
  SidebarComponent],
  templateUrl: './editar-loja.html',
  styleUrls: ['./editar-loja.css'],
})
export class EditarLoja implements OnInit {

  

  id!: number;

loja: Loja = {
  nomeLoja: '',
  cep: '',
  cpnj: '',
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
      console.log('Loja recebida:', dados);
      this.loja = dados;

      this.cdr.detectChanges(); 
    },
    error: (err) => {
      console.error(err);
      alert('Erro ao carregar loja');
    }
  });
}
  ativarEdicao() {
    this.modoEdicao = true;
  }

  salvar() {
    this.lojaService.atualizar(this.id, this.loja).subscribe({
      next: () => {
        alert('Loja atualizada com sucesso!');
        this.router.navigate(['/loja']);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/loja']);
  }
}