import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { Loja } from '../../service/loja/loja.service';
import { PedidosService, Pedido } from '../../service/pedidos.service';

interface PedidoUI extends Pedido {
  selecionado?: boolean;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  pedidos: PedidoUI[] = [];
  pedidosFiltrados: PedidoUI[] = [];
  pedidosPaginados: PedidoUI[] = [];

  busca = '';
  filtroAtivo = 'AGUARDANDO';
  somenteHoje = true;
  tipoEntregaFiltro: '' | 'BALCAO' | 'DELIVERY' = '';
  /**
   * Tipo de atendimento da loja em uso no filtro (ENTREGA/RETIRADA/AMBOS).
   * null = "ver todas as lojas" ou ainda carregando — nesses casos mostra
   * as duas abas (Balcao/Delivery) normalmente.
   */
  tipoAtendimentoLoja: 'ENTREGA' | 'RETIRADA' | 'AMBOS' | null = null;

  lojas: Loja[] = [];
  /** Loja da sessao (JWT). Se definida, trava o painel nela. */
  lojaSessaoId: number | null = null;
  /** Loja em uso no filtro. Quando travado, e sempre igual a lojaSessaoId. */
  lojaSelecionadaId: number | null = null;
  /**
   * Trava na loja da sessao. So destrava quando o usuario escolheu "ver
   * todas as lojas" no login (lojaId null no token) — af entao ele pode
   * escolher manualmente uma loja especifica ou continuar vendo todas.
   */
  travadoNaLoja = false;

  paginaAtual = 1;
  itensPorPagina = 10;
  totalPaginas = 1;
  totalRegistros = 0;
  totalTodos = 0;
  paginas: number[] = [];

  contadores = {
    novosHoje: 0,
    pendentes: 0,
    emTransito: 0,
    finalizados: 0,
    cancelados: 0,
  };

  get inicioRegistro(): number {
    return this.totalRegistros === 0 ? 0 : (this.paginaAtual - 1) * this.itensPorPagina + 1;
  }

  get fimRegistro(): number {
    return Math.min(this.paginaAtual * this.itensPorPagina, this.totalRegistros);
  }

  constructor(
    private service: PedidosService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.lojaSessaoId = this.authService.getLojaId();
    this.travadoNaLoja = this.lojaSessaoId !== null;
    this.lojaSelecionadaId = this.lojaSessaoId;

    if (this.travadoNaLoja) {
      this.carregarTipoAtendimento(this.lojaSessaoId!);
    } else {
      this.carregarLojas();
      this.carregarPedidos();
    }
  }

  carregarLojas() {
    this.service.listarLojas(0, 1000).subscribe({
      next: response => {
        this.lojas = response.content;
        this.cdr.detectChanges();
      },
      error: err => console.error('Erro ao carregar lojas', err)
    });
  }

  selecionarLoja(lojaId: number | null) {
    this.lojaSelecionadaId = lojaId;
    this.paginaAtual = 1;

    if (lojaId === null) {
      // "Ver todas as lojas": sem uma loja unica, mostra as duas abas.
      this.tipoAtendimentoLoja = null;
      this.tipoEntregaFiltro = '';
      this.carregarPedidos();
      return;
    }

    this.carregarTipoAtendimento(lojaId);
  }

  private carregarTipoAtendimento(lojaId: number) {
    this.service.listarLojas(0, 1, { id: lojaId }).subscribe({
      next: response => {
        const loja = response.content[0];
        this.tipoAtendimentoLoja = (loja?.tipoAtendimento as 'ENTREGA' | 'RETIRADA' | 'AMBOS') ?? null;

        if (this.tipoAtendimentoLoja === 'RETIRADA') {
          this.tipoEntregaFiltro = 'BALCAO';
          // "Aguardando" (filtro padrao) nao existe pra balcao — cai pro "todos".
          if (['AGUARDANDO', 'SEPARACAO', 'EM_TRANSITO'].includes(this.filtroAtivo)) {
            this.filtroAtivo = 'todos';
          }
        } else if (this.tipoAtendimentoLoja === 'ENTREGA') {
          this.tipoEntregaFiltro = 'DELIVERY';
        } else {
          this.tipoEntregaFiltro = '';
        }

        this.carregarPedidos();
      },
      error: err => {
        console.error('Erro ao carregar tipo de atendimento da loja', err);
        this.carregarPedidos();
      }
    });
  }

  carregarPedidos() {
    this.service.listar({
      page: this.paginaAtual - 1,
      size: this.itensPorPagina,
      sort: 'criadoEm,desc',
      status: this.filtroAtivo === 'todos' ? undefined : this.filtroAtivo,
      nomeCliente: this.busca.trim() || undefined,
      somenteHoje: this.somenteHoje,
      tipoEntrega: this.tipoEntregaFiltro || undefined,
      lojaId: this.lojaSelecionadaId ?? undefined
    }).subscribe({
      next: res => {
        this.pedidos = res.content.map((p: any) => this.mapearPedido(p));
        this.pedidosFiltrados = this.pedidos;
        this.pedidosPaginados = this.pedidos;
        this.totalRegistros = res.totalElements;
        this.totalPaginas = Math.max(1, res.totalPages);
        this.gerarPaginas();
        this.carregarContadores();
        this.cdr.detectChanges();
      },
      error: err => console.error('Erro ao carregar pedidos', err)
    });
  }

  carregarContadores() {
    const lojaId = this.lojaSelecionadaId ?? undefined;

    forkJoin({
      todos: this.service.listar({ page: 0, size: 1, somenteHoje: this.somenteHoje, lojaId }),
      aguardando: this.service.listar({ status: 'AGUARDANDO', page: 0, size: 1, somenteHoje: this.somenteHoje, lojaId }),
      separacao: this.service.listar({ status: 'SEPARACAO', page: 0, size: 1, somenteHoje: this.somenteHoje, lojaId }),
      transito: this.service.listar({ status: 'EM_TRANSITO', page: 0, size: 1, somenteHoje: this.somenteHoje, lojaId }),
      concluido: this.service.listar({ status: 'CONCLUIDO', page: 0, size: 1, somenteHoje: this.somenteHoje, lojaId }),
      cancelado: this.service.listar({ status: 'CANCELADO', page: 0, size: 1, somenteHoje: this.somenteHoje, lojaId }),
    }).subscribe({
      next: res => {
        this.totalTodos = res.todos.totalElements ?? 0;
        this.contadores.novosHoje = res.aguardando.totalElements ?? 0;
        this.contadores.pendentes = res.separacao.totalElements ?? 0;
        this.contadores.emTransito = res.transito.totalElements ?? 0;
        this.contadores.finalizados = res.concluido.totalElements ?? 0;
        this.contadores.cancelados = res.cancelado.totalElements ?? 0;
        this.cdr.detectChanges();
      },
      error: err => console.error('Erro ao carregar contadores de pedidos', err)
    });
  }

  filtrar(status: string) {
    this.filtroAtivo = status;
    this.paginaAtual = 1;
    this.carregarPedidos();
  }

  onBuscaChange() {
    this.paginaAtual = 1;
    this.carregarPedidos();
  }

  onSomenteHojeChange() {
    this.paginaAtual = 1;
    this.carregarPedidos();
  }

  filtrarTipoEntrega(tipo: '' | 'BALCAO' | 'DELIVERY') {
    this.tipoEntregaFiltro = tipo;

    // Balcao nao tem os status de entrega (aguardando/separacao/em transito) —
    // se o filtro ativo for um desses, cai pro "todos" pra nao sumir a lista.
    const statusSoDelivery = ['AGUARDANDO', 'SEPARACAO', 'EM_TRANSITO'];
    if (tipo === 'BALCAO' && statusSoDelivery.includes(this.filtroAtivo)) {
      this.filtroAtivo = 'todos';
    }

    this.paginaAtual = 1;
    this.carregarPedidos();
  }

  aplicarFiltros() {
    this.carregarPedidos();
  }

  atualizarPaginados() {}

  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.carregarPedidos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  gerarPaginas() {
    const total = this.totalPaginas;
    const atual = this.paginaAtual;
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) paginas.push(i);
    } else {
      paginas.push(1);
      if (atual > 3) paginas.push(-1);

      const inicio = Math.max(2, atual - 1);
      const fim = Math.min(total - 1, atual + 1);
      for (let i = inicio; i <= fim; i++) paginas.push(i);

      if (atual < total - 2) paginas.push(-1);
      paginas.push(total);
    }

    this.paginas = paginas;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      AGUARDANDO: 'status-pendente',
      SEPARACAO: 'status-processando',
      EM_TRANSITO: 'status-enviado',
      CONCLUIDO: 'status-entregue',
      CANCELADO: 'status-cancelado',
    };

    return map[status] ?? 'status-pendente';
  }

  atualizarStatus(pedido: PedidoUI) {
    const statusAnterior = pedido.statusDoPedido;

    this.service.atualizarStatus(pedido.id, pedido.statusDoPedido)
      .subscribe({
        next: () => {
          this.carregarContadores();
        },
        error: () => {
          pedido.statusDoPedido = statusAnterior;
          this.carregarPedidos();
          console.error('Erro ao atualizar status');
        }
      });
  }

  selecionarTodos(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.pedidosPaginados.forEach(p => p.selecionado = checked);
  }

  exportarRelatorio() {
    console.log('Exportando relatorio...');
  }

  verDetalhes(pedido: PedidoUI) {
    this.router.navigate(['/pedidos', pedido.id]);
  }

  imprimir(pedido: PedidoUI) {
    window.print();
  }

  private mapearPedido(p: any): PedidoUI {
    return {
      id: p.id,
      cliente: p.nomeCliente,
      statusDoPedido: p.status,
      criado: p.criadoEm,
      totalFinal: p.totalFinal ?? 0,
      totalComFrete: p.totalComFrete ?? 0,
      itens: p.itens ?? [],
      telefone: p.telefone ?? '',
      bairro: p.bairro ?? '',
      endereco: p.endereco ?? '',
      cep: p.cep ?? '',
      complemento: p.complemento ?? '',
      formaDePagamento: p.formaDePagamento ?? '',
      tipoEntrega: p.tipoEntrega ?? '',
      observacao: p.observacao ?? '',
      selecionado: false
    };
  }
}
