import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import {
  Bairro,
  BairroService
} from '../../../service/loja/bairro.service';

import {
  LojaBairro,
  LojaBairroService
} from '../../../service/loja/loja-bairro.service';

import { LojaService } from '../../../service/loja/loja.service';

@Component({
  selector: 'app-relacionar-bairro-loja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './relacionar-bairro-loja.html',
  styleUrls: ['./relacionar-bairro-loja.css']
})
export class RelacionarBairroLoja implements OnInit {

  lojaId!: number;
  lojaNome = '';

  bairros: Bairro[] = [];

  bairrosRelacionados: LojaBairro[] = [];

  carregando = false;
  salvando = false;

  form = {
    bairroId: 0,
    valorFrete: 0
  };

  novoBairroNome = '';
  criandoBairro = false;

  edicaoFreteId: number | null = null;
  edicaoFreteValor = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bairroService: BairroService,
    private lojaBairroService: LojaBairroService,
    private lojaService: LojaService
  ) {}

  ngOnInit(): void {

    this.lojaId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.carregarLoja();

    this.carregarBairros();

    this.carregarRelacionamentos();
  }

  carregarLoja() {

    this.lojaService.buscarPorId(this.lojaId).subscribe({
      next: (loja) => {
        this.lojaNome = loja.nomeLoja;
      },
      error: (err) => {
        console.error('Erro ao carregar loja', err);
      }
    });
  }

  carregarBairros() {

    this.bairroService.listar()
      .subscribe({
        next: (dados) => {
          this.bairros = dados;
        },
        error: (err) => {
          console.error('Erro ao carregar bairros', err);
        }
      });
  }

  carregarRelacionamentos() {

    this.carregando = true;

    this.lojaBairroService
      .listarPorLoja(this.lojaId)
      .subscribe({
        next: (resposta) => {
          this.bairrosRelacionados = resposta.content;
          this.carregando = false;
        },
        error: (err) => {
          console.error('Erro ao carregar bairros relacionados', err);
          this.carregando = false;
          Swal.fire('Erro', 'Não foi possível carregar os bairros da loja.', 'error');
        }
      });
  }

  criarBairro() {

    if (!this.novoBairroNome.trim()) {
      Swal.fire('Atenção', 'Digite o nome do bairro', 'warning');
      return;
    }

    this.criandoBairro = true;

    this.bairroService.criar({ nome: this.novoBairroNome.trim() }).subscribe({

      next: (bairroCriado) => {

        this.bairros = [...this.bairros, bairroCriado];

        this.novoBairroNome = '';
        this.criandoBairro = false;

        Swal.fire('Sucesso', 'Bairro criado com sucesso!', 'success');
      },

      error: (err) => {
        console.error('Erro ao criar bairro', err);
        this.criandoBairro = false;
        Swal.fire('Erro', 'Erro ao criar bairro', 'error');
      }
    });
  }

  salvar() {

    if (!this.form.bairroId) {
      Swal.fire('Atenção', 'Selecione um bairro', 'warning');
      return;
    }

    const bairroSelecionado = this.bairros.find(
      b => b.id === this.form.bairroId
    );

    if (!bairroSelecionado) {
      Swal.fire('Erro', 'Bairro selecionado não encontrado', 'error');
      return;
    }

    this.salvando = true;

    this.lojaBairroService.criar({

      lojaId: this.lojaId,
      lojaNome: this.lojaNome,

      bairroId: this.form.bairroId,
      bairroNom: bairroSelecionado.nome,

      valorFrete: this.form.valorFrete

    }).subscribe({

      next: () => {

        Swal.fire('Sucesso', 'Bairro relacionado com sucesso!', 'success');

        this.form = {
          bairroId: 0,
          valorFrete: 0
        };

        this.salvando = false;

        this.carregarRelacionamentos();
      },

      error: (err) => {
        console.error('Erro ao relacionar bairro', err);
        this.salvando = false;
        Swal.fire('Erro', 'Erro ao relacionar bairro', 'error');
      }
    });
  }

  editarFrete(item: LojaBairro) {
    this.edicaoFreteId = item.id ?? null;
    this.edicaoFreteValor = item.valorFrete;
  }

  cancelarEdicaoFrete() {
    this.edicaoFreteId = null;
  }

  salvarFrete(item: LojaBairro) {

    if (!item.id) return;

    this.lojaBairroService.atualizarFrete(item.id, this.edicaoFreteValor).subscribe({

      next: (atualizado) => {

        item.valorFrete = atualizado.valorFrete;

        this.edicaoFreteId = null;

        Swal.fire('Sucesso', 'Frete atualizado com sucesso!', 'success');
      },

      error: (err) => {
        console.error('Erro ao atualizar frete', err);
        Swal.fire('Erro', 'Erro ao atualizar o frete', 'error');
      }
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
