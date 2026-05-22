import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  Bairro,
  BairroService
} from '../../../../service/loja/bairro.service';

import { NavbarAdministradorComponent }
from "../../../../shared/navbar-administrador/navbar-administrador";

import { SidebarComponent }
from '../../../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-add-bairro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarAdministradorComponent,
    SidebarComponent
  ],
  templateUrl: './add-bairro.html',
  styleUrls: ['./add-bairro.css']
})
export class AddBairro implements OnInit {

  bairros: Bairro[] = [];

  bairro: Bairro = {
    nome: ''
  };

  carregando = false;

  constructor(
    private bairroService: BairroService
  ) {}

  ngOnInit(): void {
    this.carregarBairros();
  }

  carregarBairros() {

    this.carregando = true;

    this.bairroService.listar().subscribe({

      next: (dados) => {

        console.log(
          'Bairros recebidos:',
          dados
        );

        // força renderização da tela
        this.bairros = [...dados];

        this.carregando = false;
      },

      error: (err) => {

        console.error(err);

        this.carregando = false;

        alert(
          'Erro ao carregar bairros'
        );
      }
    });
  }

  salvar() {

    if (!this.bairro.nome.trim()) {

      alert(
        'Digite o nome do bairro'
      );

      return;
    }

    this.bairroService
      .criar(this.bairro)
      .subscribe({

        next: (bairroCriado) => {

          alert(
            'Bairro cadastrado!'
          );

          // adiciona direto na lista
          this.bairros = [
            ...this.bairros,
            bairroCriado
          ];

          // limpa form
          this.bairro = {
            nome: ''
          };
        },

        error: (err) => {

          console.error(err);

          alert(
            'Erro ao cadastrar bairro'
          );
        }
      });
  }

  deletar(id?: number) {

    if (!id) return;

    const confirmou = confirm(
      'Deseja excluir esse bairro?'
    );

    if (!confirmou) return;

    this.bairroService
      .deletar(id)
      .subscribe({

        next: () => {

          // remove da tela instantaneamente
          this.bairros =
            this.bairros.filter(
              bairro => bairro.id !== id
            );

          alert(
            'Bairro removido!'
          );
        },

        error: (err) => {

          console.error(err);

          alert(
            'Erro ao excluir bairro'
          );
        }
      });
  }
}