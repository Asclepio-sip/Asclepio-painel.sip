import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MovimentacaoEstoque,
  MovimentacaoEstoqueFiltros,
  MovimentacaoLoja,
  RelatorioEstoqueService,
  TipoMovimentacaoEstoque
} from '../../../service/Relatorio-estoque.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-relatorio-estoque',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
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
    'ENTRADA_NO_ESTOQUE',
    'ATUALIZACAO',
    'ENTRADA',
    'SAIDA_PEDIDO',
    'PROMOCAO',
    'DELECAO'
  ];

  movimentacoes: MovimentacaoEstoque[] = [];
  lojas: MovimentacaoLoja[] = [];
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
    private relatorioEstoqueService: RelatorioEstoqueService
  ) {}

  ngOnInit() {
    this.carregarLojas();
    this.buscar();
  }

  carregarLojas() {
    this.relatorioEstoqueService
      .listarLojas()
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

    forkJoin({
      relatorio: this.relatorioEstoqueService.listar(this.filtros),
      estoques: this.relatorioEstoqueService.relatorioEstoqueLojas(0, 1000),
      produtos: this.relatorioEstoqueService.listarProdutos(0, 1000)
    })
      .subscribe({
        next: ({ relatorio: res, estoques, produtos }) => {
          this.movimentacoes = res.content.map((movimentacao) => {
            const itemEstoque = estoques.content.find(
              (estoque) => estoque.id === movimentacao.estoqueId
            );
            const produtoId = movimentacao.produtoId ?? itemEstoque?.produtoId ?? null;
            const produto = produtos.content.find((item) => item.id === produtoId);

            return {
              ...movimentacao,
              produtoId,
              nomeProduto:
                movimentacao.nomeProduto ||
                itemEstoque?.nomeProduto ||
                produto?.name ||
                'Produto não encontrado',
              imagemUrl:
                itemEstoque?.imagemUrl ||
                produto?.imagemUrl ||
                (produto?.imagemBase64
                  ? `data:image/png;base64,${produto.imagemBase64}`
                  : '')
            };
          });
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
      ENTRADA_NO_ESTOQUE: 'Entrada no estoque',
      CRIACAO: 'Criação de estoque',
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
