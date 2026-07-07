import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Bairro,
  BairroService
} from '../../../service/loja/bairro.service';

import {
  LojaBairro,
  LojaBairroService
} from '../../../service/loja/loja-bairro.service';

@Component({
  selector: 'app-relacionar-bairro-loja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './relacionar-bairro-loja.html',
  styleUrls: ['./relacionar-bairro-loja.css']
})
export class RelacionarBairroLoja implements OnInit {

  lojaId!: number;

  bairros: Bairro[] = [];

  bairrosRelacionados: LojaBairro[] = [];

  form = {
    bairroId: 0,
    valorFrete: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bairroService: BairroService,
    private lojaBairroService: LojaBairroService
  ) {}

  ngOnInit(): void {

    this.lojaId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.carregarBairros();

    this.carregarRelacionamentos();
  }

  carregarBairros() {

    this.bairroService.listar()
      .subscribe({
        next: (dados) => {
          this.bairros = dados;
        }
      });
  }

  carregarRelacionamentos() {

    this.lojaBairroService
      .listarPorLoja(this.lojaId)
      .subscribe({
        next: (dados) => {
          this.bairrosRelacionados = dados;
        }
      });
  }

  salvar() {

    if (!this.form.bairroId) {
      alert('Selecione um bairro');
      return;
    }

    this.lojaBairroService.criar({

      lojaId: this.lojaId,

      bairroId: this.form.bairroId,

      valorFrete: this.form.valorFrete

    }).subscribe({

      next: () => {

        alert('Bairro relacionado!');

        this.form = {
          bairroId: 0,
          valorFrete: 0
        };

        this.carregarRelacionamentos();
      },

      error: (err) => {
        console.error(err);
        alert('Erro ao relacionar bairro');
      }
    });
  }

  deletar(id?: number) {

    if (!id) return;

    const confirmou =
      confirm('Excluir relação?');

    if (!confirmou) return;

    this.lojaBairroService
      .deletar(id)
      .subscribe(() => {

        this.carregarRelacionamentos();
      });
  }

  voltar() {
    this.router.navigate(['/loja']);
  }

  getNomeBairro(id: number) {

    return this.bairros.find(
      b => b.id === id
    )?.nome;
  }
}