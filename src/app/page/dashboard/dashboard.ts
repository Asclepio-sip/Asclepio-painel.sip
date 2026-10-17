import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { EstoqueLoja, EstoqueService } from '../../service/estoque.service';
import {
  DashboardFinanceiro,
  DashboardService,
  PontoFinanceiro,
  ResumoFinanceiro
} from '../../service/dashboard.service';

type Periodo = 'semana' | 'mes' | 'trimestre' | 'personalizado';

/** Barra já posicionada no gráfico (top/height em % da área do gráfico). */
interface Barra {
  top: number;
  height: number;
  negativo: boolean;
}

interface Coluna {
  ponto: PontoFinanceiro;
  custo: Barra;
  lucro: Barra;
  /** Mostra o rótulo do eixo X (com muitos pontos, só alguns aparecem). */
  mostrarRotulo: boolean;
}

interface Grafico {
  colunas: Coluna[];
  linhas: { valor: number; top: number }[];
  /** Posição da linha do zero (% a partir do topo). */
  zero: number;
}

const MAX_DIAS = 366;
/** Ranking começa com 5 linhas; "Ver top 10" mostra tudo o que o backend manda. */
const TOP_INICIAL = 5;

/** Linha de ranking já com a largura da barra (% do maior valor). */
interface LinhaRanking<T> {
  item: T;
  largura: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  readonly periodos: { id: Exclude<Periodo, 'personalizado'>; rotulo: string }[] = [
    { id: 'semana', rotulo: '1 semana' },
    { id: 'mes', rotulo: '1 mês' },
    { id: 'trimestre', rotulo: '3 meses' },
  ];

  periodo = signal<Periodo>('mes');
  inicio = signal(this.diasAtras(0, 1));
  fim = signal(this.hoje());

  /** Campos do "Personalizado" (só valem ao clicar em Aplicar). */
  inicioManual = this.diasAtras(0, 1);
  fimManual = this.hoje();
  erroPeriodo = signal<string | null>(null);

  lojas = signal<EstoqueLoja[]>([]);
  /** null = todas as lojas. */
  lojaId = signal<number | null>(null);
  /** Funcionário que não é gerente fica na loja do token (mesma regra das telas de estoque/pedido). */
  lojaTravada = false;

  dados = signal<DashboardFinanceiro | null>(null);
  carregando = signal(false);
  erro = signal<string | null>(null);

  /** Índice da coluna com o mouse/foco em cima (tooltip). */
  ativa = signal<number | null>(null);
  verTabela = signal(false);

  verTodosProdutos = signal(false);
  verTodosClientes = signal(false);
  readonly topInicial = TOP_INICIAL;

  private readonly moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private readonly numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  private readonly moedaCurta = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1
  });

  constructor(
    private dashboardService: DashboardService,
    private estoqueService: EstoqueService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const lojaSessao = this.authService.getLojaId();
    this.lojaTravada = lojaSessao !== null && !this.authService.isGerente();
    if (this.lojaTravada) {
      this.lojaId.set(lojaSessao);
    } else {
      this.carregarLojas();
    }
    this.carregar();
  }

  // ── Filtros ──

  escolherPeriodo(periodo: Exclude<Periodo, 'personalizado'>) {
    const meses = periodo === 'trimestre' ? 3 : periodo === 'mes' ? 1 : 0;
    this.periodo.set(periodo);
    this.inicio.set(periodo === 'semana' ? this.diasAtras(6) : this.diasAtras(0, meses));
    this.fim.set(this.hoje());
    this.erroPeriodo.set(null);
    this.carregar();
  }

  abrirPersonalizado() {
    this.inicioManual = this.inicio();
    this.fimManual = this.fim();
    this.periodo.set('personalizado');
  }

  aplicarPersonalizado() {
    const erro = this.validarPeriodo(this.inicioManual, this.fimManual);
    this.erroPeriodo.set(erro);
    if (erro) return;

    this.inicio.set(this.inicioManual);
    this.fim.set(this.fimManual);
    this.carregar();
  }

  escolherLoja(lojaId: number | null) {
    this.lojaId.set(lojaId);
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.erro.set(null);
    this.ativa.set(null);
    this.verTodosProdutos.set(false);
    this.verTodosClientes.set(false);

    this.dashboardService.financeiro(this.inicio(), this.fim(), this.lojaId()).subscribe({
      next: dados => {
        this.dados.set(dados);
        this.carregando.set(false);
      },
      error: err => {
        this.carregando.set(false);
        this.erro.set(err?.error?.message || 'Não foi possível carregar o dashboard.');
      }
    });
  }

  private carregarLojas() {
    this.estoqueService.listarLojas().subscribe({
      next: res => this.lojas.set(res.content),
      // Sem acesso à lista de lojas: fica só "todas as lojas"
      error: () => this.lojas.set([])
    });
  }

  private validarPeriodo(inicio: string, fim: string): string | null {
    if (!inicio || !fim) return 'Informe a data inicial e a final.';
    if (fim < inicio) return 'A data final não pode ser antes da inicial.';
    if (fim > this.hoje()) return 'A data final não pode ser no futuro.';
    if (this.diasEntre(inicio, fim) > MAX_DIAS) return 'O período pode ter no máximo 1 ano.';
    return null;
  }

  // ── Indicadores ──

  /** Variação % contra o período anterior; null se não dá para comparar. */
  variacao(campo: keyof Pick<ResumoFinanceiro, 'faturamento' | 'custo' | 'lucro'>): number | null {
    const d = this.dados();
    if (!d) return null;
    const anterior = d.periodoAnterior[campo];
    if (!anterior) return null;
    return ((d.resumo[campo] - anterior) / Math.abs(anterior)) * 100;
  }

  // ── Gráfico ──

  grafico = computed<Grafico | null>(() => {
    const serie = this.dados()?.serie;
    if (!serie?.length) return null;

    const valores = serie.flatMap(p => [p.custo, p.lucro]);
    const { min, max, passo } = this.escala(Math.min(0, ...valores), Math.max(0, ...valores));
    const pos = (v: number) => ((max - v) / (max - min)) * 100;
    const zero = pos(0);

    const barra = (v: number): Barra => v >= 0
      ? { top: pos(v), height: zero - pos(v), negativo: false }
      : { top: zero, height: pos(v) - zero, negativo: true };

    // No máximo ~8 rótulos no eixo X, para não encavalar
    const cada = Math.ceil(serie.length / 8);

    const linhas: { valor: number; top: number }[] = [];
    for (let v = min; v <= max + passo / 2; v += passo) {
      linhas.push({ valor: v, top: pos(v) });
    }

    return {
      zero,
      linhas,
      colunas: serie.map((ponto, i) => ({
        ponto,
        custo: barra(ponto.custo),
        lucro: barra(ponto.lucro),
        mostrarRotulo: i % cada === 0
      }))
    };
  });

  // ── Rankings ──

  produtos = computed(() =>
    this.ranking(this.dados()?.produtosMaisVendidos ?? [], p => p.quantidade, this.verTodosProdutos())
  );

  clientes = computed(() =>
    this.ranking(this.dados()?.clientesQueMaisCompraram ?? [], c => c.valor, this.verTodosClientes())
  );

  private ranking<T>(itens: T[], valor: (item: T) => number, todos: boolean): LinhaRanking<T>[] {
    const maior = Math.max(0, ...itens.map(valor));
    return (todos ? itens : itens.slice(0, TOP_INICIAL)).map(item => ({
      item,
      // Barra mínima de 2% para valor pequeno não sumir
      largura: maior > 0 ? Math.max(2, (valor(item) / maior) * 100) : 0
    }));
  }

  telefoneFormatado(telefone: string | null): string {
    const d = (telefone ?? '').replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return telefone ?? '';
  }

  dataCurta(data: string): string {
    const [, mes, dia] = data.split('-');
    return `${dia}/${mes}`;
  }

  /** Tooltip à esquerda/direita conforme a coluna, para não sair da tela. */
  posicaoTooltip(indice: number, total: number): string {
    return `${((indice + 0.5) / total) * 100}%`;
  }

  tooltipAlinhaDireita(indice: number, total: number): boolean {
    return indice > total / 2;
  }

  /** Eixo X: por semana mostra só o primeiro dia ("06/10"); o período inteiro fica no tooltip. */
  rotuloEixo(ponto: PontoFinanceiro): string {
    return this.dados()?.agrupamento === 'SEMANA' ? ponto.rotulo.split(' a ')[0] : ponto.rotulo;
  }

  moedaFormatada(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '—' : this.moeda.format(valor);
  }

  /** "43,8%" (o pipe number do app formata em inglês). */
  percentual(valor: number | null): string {
    return valor === null ? '—' : `${this.numero.format(valor)}%`;
  }

  moedaCompacta(valor: number): string {
    return this.moedaCurta.format(valor);
  }

  get descricaoPeriodo(): string {
    return `${this.dataBr(this.inicio())} a ${this.dataBr(this.fim())}`;
  }

  get rotuloAgrupamento(): string {
    switch (this.dados()?.agrupamento) {
      case 'SEMANA': return 'por semana';
      case 'MES': return 'por mês';
      default: return 'por dia';
    }
  }

  /** Escala "redonda" (1, 2, 2,5 ou 5 × 10ⁿ) com ~4 divisões. */
  private escala(minimo: number, maximo: number): { min: number; max: number; passo: number } {
    if (minimo === 0 && maximo === 0) {
      return { min: 0, max: 100, passo: 25 };
    }
    const bruto = (maximo - minimo) / 4;
    const potencia = Math.pow(10, Math.floor(Math.log10(bruto)));
    const passo = [1, 2, 2.5, 5, 10].map(m => m * potencia).find(p => p >= bruto)!;
    return {
      min: Math.floor(minimo / passo) * passo,
      max: Math.ceil(maximo / passo) * passo,
      passo
    };
  }

  // ── Datas (sempre no fuso local, em yyyy-MM-dd) ──

  private hoje(): string {
    return this.formatarData(new Date());
  }

  private diasAtras(dias: number, meses = 0): string {
    const d = new Date();
    d.setMonth(d.getMonth() - meses);
    d.setDate(d.getDate() - dias + (meses ? 1 : 0));
    return this.formatarData(d);
  }

  private formatarData(d: Date): string {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  private diasEntre(inicio: string, fim: string): number {
    const [a, b] = [inicio, fim].map(s => {
      const [ano, mes, dia] = s.split('-').map(Number);
      return Date.UTC(ano, mes - 1, dia);
    });
    return Math.round((b - a) / 86_400_000) + 1;
  }

  private dataBr(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
