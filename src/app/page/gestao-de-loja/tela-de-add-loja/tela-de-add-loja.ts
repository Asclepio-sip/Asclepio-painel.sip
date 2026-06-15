import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LojaService } from '../../../service/loja/loja.service';

import { NavbarAdministradorComponent } from "../../../shared/navbar-administrador/navbar-administrador";
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-tela-de-add-loja',
  standalone: true,
  templateUrl: './tela-de-add-loja.html',
  styleUrl: './tela-de-add-loja.css',
  imports: [
    FormsModule,
    NavbarAdministradorComponent,
    SidebarComponent
  ]
})
export class TelaDeAddLoja {

  nomeLoja = '';
  cep = '';
  cpnj = '';
  telefone = '';
  textoDescricao = '';
  tipoAtendimento = '';
  valorMinimoFreteGratis: number | null = null;

  constructor(
    private lojaService: LojaService,
    private router: Router
  ) {}

  salvar() {

    const novaLoja = {

      nomeLoja: this.nomeLoja,

      cep: this.cep,

      cpnj: this.cpnj || null,

      telefone: this.telefone,

      textoDescricao: this.textoDescricao || null,

      tipoAtendimento: this.tipoAtendimento,

      valorMinimoFreteGratis:
        this.valorMinimoFreteGratis ?? 0
    };

    console.log(novaLoja);

    this.lojaService.criar(novaLoja).subscribe({

      next: () => {

        alert('Loja criada com sucesso!');

        this.router.navigate(['/lojas']);
      },

      error: (err) => {

        console.error(err);

        alert('Erro ao criar loja');
      }
    });
  }

  cancelar() {
    this.router.navigate(['/pedidos']);
  }
}