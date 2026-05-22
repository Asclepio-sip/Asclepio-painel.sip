import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosService, Pedido } from '../../../service/pedidos.service';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { NavbarAdministradorComponent } from '../../../shared/navbar-administrador/navbar-administrador';
import { Router } from '@angular/router';


interface PedidoUI extends Pedido {
  selecionado?: boolean;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, NavbarAdministradorComponent],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {

  pedidos: PedidoUI[] = [];
  pedidosFiltrados: PedidoUI[] = [];
  pedidosPaginados: PedidoUI[] = [];

  busca = '';
 filtroAtivo = 'Aguardando';

  paginaAtual = 1;
  itensPorPagina = 10;
  totalPaginas = 1;
  paginas: number[] = [];

  contadores = {
    novosHoje: 0,
    pendentes: 0,
    emTransito: 0,
    finalizados: 0,
    cancelados: 0,
  };

  get inicioRegistro(): number {
    return this.pedidosFiltrados.length === 0 ? 0 : (this.paginaAtual - 1) * this.itensPorPagina + 1;
  }

  get fimRegistro(): number {
    return Math.min(this.paginaAtual * this.itensPorPagina, this.pedidosFiltrados.length);
  }

  constructor(
    private service: PedidosService,
    private router: Router,
    private cdr: ChangeDetectorRef  // 👈 adicionado
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();
  }

carregarPedidos() {
  this.service.listar().subscribe(res => {
this.pedidos = res.map((p: any) => ({
  id: p.id,

  // mapeando API → frontend
  cliente: p.nomeCliente,
  statusDoPedido: p.status,
  criado: p.criadoEm,
  totalFinal: p.totalFinal ?? 0,

  // campos opcionais
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
}));
    this.calcularContadores();
    this.aplicarFiltros();
    this.cdr.detectChanges(); // 👈 força atualizar a view
  });
}

calcularContadores() {

  const hoje = new Date().toDateString();

  this.contadores.novosHoje =
    this.pedidos.filter(p =>
      p.statusDoPedido === 'AGUARDANDO' &&
      new Date(p.criado).toDateString() === hoje
    ).length;

  this.contadores.pendentes =
    this.pedidos.filter(p =>
      p.statusDoPedido === 'SEPARACAO'
    ).length;

  this.contadores.emTransito =
    this.pedidos.filter(p =>
      p.statusDoPedido === 'EM_TRANSITO'
    ).length;

  this.contadores.finalizados =
    this.pedidos.filter(p =>
      p.statusDoPedido === 'CONCLUIDO'
    ).length;

  this.contadores.cancelados =
    this.pedidos.filter(p =>
      p.statusDoPedido === 'CANCELADO'
    ).length;
}

 filtrar(status: string) {

  this.filtroAtivo = status;
  this.paginaAtual = 1;

  // Se clicou em TODOS
  if (status === 'todos') {

    this.service.buscarTodosPedidos()
      .subscribe(res => {

        this.pedidos = res.map((p: any) => ({
          id: p.id,
          cliente: p.nomeCliente,
          statusDoPedido: p.status,
          criado: p.criadoEm,
          totalFinal: p.totalFinal ?? 0,

          totalComFrete:
            p.totalComFrete ?? 0,

          itens:
            p.itens ?? [],

          telefone:
            p.telefone ?? '',

          bairro:
            p.bairro ?? '',

          endereco:
            p.endereco ?? '',

          cep:
            p.cep ?? '',

          complemento:
            p.complemento ?? '',

          formaDePagamento:
            p.formaDePagamento ?? '',

          tipoEntrega:
            p.tipoEntrega ?? '',

          observacao:
            p.observacao ?? '',

          selecionado: false
        }));

        this.calcularContadores();
        this.aplicarFiltros();
      });

    return;
  }

  // outros filtros continuam local
  this.aplicarFiltros();
}

  onBuscaChange() {
    this.paginaAtual = 1;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let lista = [...this.pedidos];

    if (this.filtroAtivo !== 'todos') {
lista = lista.filter(p => p.statusDoPedido === this.filtroAtivo);    }

    if (this.busca.trim()) {
      const termo = this.busca.toLowerCase();
      lista = lista.filter(p =>
        p.cliente.toLowerCase().includes(termo) ||
        String(p.id).includes(termo)
      );
    }

    this.pedidosFiltrados = lista;
    this.totalPaginas = Math.max(1, Math.ceil(lista.length / this.itensPorPagina));

    if (this.paginaAtual > this.totalPaginas) {
      this.paginaAtual = 1;
    }

    this.gerarPaginas();
    this.atualizarPaginados();
  }

  atualizarPaginados() {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    this.pedidosPaginados = this.pedidosFiltrados.slice(inicio, inicio + this.itensPorPagina);
  }

  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.gerarPaginas();
    this.atualizarPaginados();
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

    'AGUARDANDO':
      'status-pendente',

    'SEPARACAO':
      'status-processando',

    'EM_TRANSITO':
      'status-enviado',

    'CONCLUIDO':
      'status-entregue',

    'CANCELADO':
      'status-cancelado',
  };

  return map[status]
    ?? 'status-pendente';
}

  
atualizarStatus(pedido: PedidoUI) {

  const statusAnterior = pedido.statusDoPedido;

  // 🔥 Atualiza na tela na hora
  this.calcularContadores();
  this.aplicarFiltros();

  this.service.atualizarStatus(pedido.id, pedido.statusDoPedido)
    .subscribe({
      next: () => {
        console.log(`Pedido #${pedido.id} atualizado com sucesso`);
      },
      error: () => {
        // ❌ Se der erro, volta pro status antigo
        pedido.statusDoPedido = statusAnterior;
        this.calcularContadores();
        this.aplicarFiltros();
        console.error('Erro ao atualizar status');
      }
    });
}

  selecionarTodos(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.pedidosPaginados.forEach(p => p.selecionado = checked);
  }

  exportarRelatorio() {
    console.log('Exportando relatório...');
  }

  verDetalhes(pedido: PedidoUI) {
    this.router.navigate(['/pedidos', pedido.id]);
  }

  imprimir(pedido: PedidoUI) {
    window.print();
  }

  
}