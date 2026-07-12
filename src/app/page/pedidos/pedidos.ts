import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos() {
    this.service.listar({
      page: this.paginaAtual - 1,
      size: this.itensPorPagina,
      sort: 'criadoEm,desc',
      status: this.filtroAtivo === 'todos' ? undefined : this.filtroAtivo,
      nomeCliente: this.busca.trim() || undefined,
      somenteHoje: this.somenteHoje
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
    forkJoin({
      todos: this.service.listar({ page: 0, size: 1, somenteHoje: this.somenteHoje }),
      aguardando: this.service.listar({ status: 'AGUARDANDO', page: 0, size: 1, somenteHoje: this.somenteHoje }),
      separacao: this.service.listar({ status: 'SEPARACAO', page: 0, size: 1, somenteHoje: this.somenteHoje }),
      transito: this.service.listar({ status: 'EM_TRANSITO', page: 0, size: 1, somenteHoje: this.somenteHoje }),
      concluido: this.service.listar({ status: 'CONCLUIDO', page: 0, size: 1, somenteHoje: this.somenteHoje }),
      cancelado: this.service.listar({ status: 'CANCELADO', page: 0, size: 1, somenteHoje: this.somenteHoje }),
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
