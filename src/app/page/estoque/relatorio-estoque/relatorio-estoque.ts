import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarAdministradorComponent } from '../../../shared/navbar-administrador/navbar-administrador';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import {
  MovimentacaoEstoque,
  MovimentacaoEstoqueFiltros,
  RelatorioEstoqueService,
  TipoMovimentacaoEstoque
} from '../../../service/Relatorio-estoque.service';
import {
  Loja,
  LojaService
} from '../../../service/loja/loja.service';

@Component({
  selector: 'app-relatorio-estoque',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarAdministradorComponent,
    SidebarComponent
  ],
  templateUrl: './relatorio-estoque.html',
  styleUrl: './relatorio-estoque.css',
})
export class RelatorioEstoque implements OnInit {
  filtros: MovimentacaoEstoqueFiltros = {
    page: 0,
    size: 20,
    sort: 'criadoEm,desc'
  };

  tipos: TipoMovimentacaoEstoque[] = [
    'CRIACAO',
    'ATUALIZACAO',
    'ENTRADA',
    'SAIDA_PEDIDO',
    'PROMOCAO',
    'DELECAO'
  ];

  movimentacoes: MovimentacaoEstoque[] = [];
  lojas: Loja[] = [];
  carregando = false;
  erro = '';
  totalElementos = 0;
  totalPaginas = 0;
  paginaAtual = 0;
  periodoSelecionado = '';

  periodos = [
    { label: 'Semana atual', value: 'semana-atual' },
    { label: 'Mês atual', value: 'mes-atual' },
    { label: 'Últimos 3 meses', value: 'ultimos-3-meses' },
    { label: 'Últimos 6 meses', value: 'ultimos-6-meses' },
    { label: 'Último ano', value: 'ultimo-ano' }
  ];

  constructor(
    private relatorioEstoqueService: RelatorioEstoqueService,
    private lojaService: LojaService
  ) {}

  ngOnInit() {
    this.carregarLojas();
    this.buscar();
  }

  carregarLojas() {
    this.lojaService
      .listar()
      .subscribe({
        next: (response) => {
          this.lojas = response.content;
        },
        error: (err) => {
          console.error('Erro ao carregar lojas', err);
        }
      });
  }

  buscar(page: number = 0) {
    this.carregando = true;
    this.erro = '';
    this.filtros.page = page;

    this.relatorioEstoqueService
      .listar(this.filtros)
      .subscribe({
        next: (res) => {
          this.movimentacoes = res.content;
          this.totalElementos = res.totalElements;
          this.totalPaginas = res.totalPages;
          this.paginaAtual = res.number;
          this.carregando = false;
        },
        error: (err) => {
          console.error('Erro ao carregar movimentacoes de estoque', err);
          this.erro = 'Nao foi possivel carregar o historico de movimentacoes.';
          this.movimentacoes = [];
          this.carregando = false;
        }
      });
  }

  limparFiltros() {
    this.filtros = {
      page: 0,
      size: 20,
      sort: 'criadoEm,desc'
    };
    this.periodoSelecionado = '';

    this.buscar();
  }

  aplicarPeriodo(periodo: string) {
    const hoje = new Date();
    const inicio = new Date(hoje);

    this.periodoSelecionado = periodo;

    if (periodo === 'semana-atual') {
      const diaSemana = hoje.getDay();
      const diferenca = diaSemana === 0 ? 6 : diaSemana - 1;
      inicio.setDate(hoje.getDate() - diferenca);
    }

    if (periodo === 'mes-atual') {
      inicio.setDate(1);
    }

    if (periodo === 'ultimos-3-meses') {
      inicio.setMonth(hoje.getMonth() - 3);
    }

    if (periodo === 'ultimos-6-meses') {
      inicio.setMonth(hoje.getMonth() - 6);
    }

    if (periodo === 'ultimo-ano') {
      inicio.setFullYear(hoje.getFullYear() - 1);
    }

    this.filtros.dataInicio = this.formatarDataInput(inicio);
    this.filtros.dataFim = this.formatarDataInput(hoje);
    this.buscar();
  }

  paginaAnterior() {
    if (this.paginaAtual > 0) {
      this.buscar(this.paginaAtual - 1);
    }
  }

  proximaPagina() {
    if (this.paginaAtual < this.totalPaginas - 1) {
      this.buscar(this.paginaAtual + 1);
    }
  }

  rotuloTipo(tipo: TipoMovimentacaoEstoque) {
    const labels: Record<TipoMovimentacaoEstoque, string> = {
      CRIACAO: 'Criacao',
      ATUALIZACAO: 'Atualizacao',
      ENTRADA: 'Entrada',
      SAIDA_PEDIDO: 'Saida por pedido',
      PROMOCAO: 'Promocao',
      DELECAO: 'Exclusao'
    };

    return labels[tipo] ?? tipo;
  }

  formatarData(data: string) {
    if (!data) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  formatarMoeda(valor: number | null) {
    if (valor === null || valor === undefined) {
      return '-';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarValor(valor: number | null) {
    return valor === null || valor === undefined ? '-' : valor;
  }

  private formatarDataInput(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }
}
