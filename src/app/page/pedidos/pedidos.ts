import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../service/auth.service';
import { CatalogoOnlineService } from '../../service/catalogo-online.service';
import { AppPermissions } from '../../core/security/app-permissions';
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
  /**
   * Catálogo online da empresa (GET /config-conta). null = não deu pra saber
   * (sem VerConfigConta ou erro) — trata como ligado pra não esconder pedido.
   */
  catalogoOnlineAtivo: boolean | null = null;

  /**
   * Loja só de retirada e sem catálogo online: todo pedido é venda na hora,
   * então só existem Concluído/Cancelado. Com catálogo ligado os pedidos
   * de retirada chegam como Aguardando, por isso aí mostra todos os cards.
   */
  get somenteVendaNaHora(): boolean {
    return this.tipoAtendimentoLoja === 'RETIRADA' && this.catalogoOnlineAtivo === false;
  }

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
    private catalogoService: CatalogoOnlineService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.lojaSessaoId = this.authService.getLojaId();
    this.travadoNaLoja = this.lojaSessaoId !== null;
    this.lojaSelecionadaId = this.lojaSessaoId;

    this.carregarStatusCatalogo(() => {
      if (this.travadoNaLoja) {
        this.carregarTipoAtendimento(this.lojaSessaoId!);
      } else {
        this.carregarLojas();
        this.carregarPedidos();
      }
    });
  }

  /** Só consulta com VerConfigConta: sem ela o GET dá 403 e o interceptor desloga. */
  private carregarStatusCatalogo(depois: () => void) {
    if (!this.authService.hasPermission(AppPermissions.ConfigConta.read)) {
      depois();
      return;
    }

    this.catalogoService.getConfig().subscribe({
      next: config => {
        this.catalogoOnlineAtivo = config?.catalogoOnlineAtivo ?? null;
        depois();
      },
      error: err => {
        console.error('Erro ao carregar status do catálogo online', err);
        depois();
      }
    });
  }

  /** Sem os cards de andamento, um filtro neles sumiria com a lista — cai pro "todos". */
  private ajustarFiltroVendaNaHora() {
    if (this.somenteVendaNaHora && ['AGUARDANDO', 'SEPARACAO', 'EM_TRANSITO'].includes(this.filtroAtivo)) {
      this.filtroAtivo = 'todos';
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
          this.ajustarFiltroVendaNaHora();
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
    this.service.contadores({
      lojaId: this.lojaSelecionadaId ?? undefined,
      nomeCliente: this.busca.trim() || undefined,
      tipoEntrega: this.tipoEntregaFiltro || undefined,
      somenteHoje: this.somenteHoje
    }).subscribe({
      next: res => {
        this.totalTodos = res.todos;
        this.contadores.novosHoje = res.aguardando;
        this.contadores.pendentes = res.separacao;
        this.contadores.emTransito = res.emTransito;
        this.contadores.finalizados = res.concluido;
        this.contadores.cancelados = res.cancelado;
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
    this.ajustarFiltroVendaNaHora();

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

  readonly statusOpcoes = [
    { value: 'AGUARDANDO', label: 'Aguardando', classe: 'status-pendente' },
    { value: 'SEPARACAO', label: 'Separação', classe: 'status-processando' },
    { value: 'EM_TRANSITO', label: 'Em trânsito', classe: 'status-enviado' },
    { value: 'CONCLUIDO', label: 'Concluído', classe: 'status-entregue' },
    { value: 'CANCELADO', label: 'Cancelado', classe: 'status-cancelado' },
  ];

  /** Menu de status aberto (posição fixa na tela, calculada pelo botão). */
  menuStatus: { pedido: PedidoUI; top: number; left: number; acima: boolean } | null = null;

  /**
   * Entrega: todos os status. Retirada na loja: sem Separação/Em trânsito.
   * Balcão (venda na hora): só Concluído e Cancelado.
   */
  opcoesStatus(pedido: PedidoUI) {
    const tipo = pedido.tipoAtendimento;
    if (!tipo || tipo.startsWith('ENTREGA')) return this.statusOpcoes;

    const permitidos = tipo === 'BALCAO' ? ['CONCLUIDO', 'CANCELADO'] : ['AGUARDANDO', 'CONCLUIDO', 'CANCELADO'];
    return this.statusOpcoes.filter(o => permitidos.includes(o.value));
  }

  rotuloStatus(status: string): string {
    return this.statusOpcoes.find(o => o.value === status)?.label ?? status;
  }

  abrirMenuStatus(pedido: PedidoUI, event: MouseEvent) {
    event.stopPropagation();

    if (this.menuStatus?.pedido === pedido) {
      this.fecharMenuStatus();
      return;
    }

    const botao = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const alturaMenu = 230;
    const acima = window.innerHeight - botao.bottom < alturaMenu && botao.top > alturaMenu;

    this.menuStatus = {
      pedido,
      top: acima ? botao.top - 6 : botao.bottom + 6,
      left: Math.min(botao.left, window.innerWidth - 200 - 8),
      acima
    };
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  @HostListener('window:resize')
  @HostListener('window:scroll')
  // O painel rola dentro de um container, não na janela: roda do mouse/toque também fecha
  @HostListener('document:wheel')
  @HostListener('document:touchmove')
  fecharMenuStatus() {
    if (this.menuStatus) {
      this.menuStatus = null;
      this.cdr.detectChanges();
    }
  }

  escolherStatus(pedido: PedidoUI, novoStatus: string) {
    this.fecharMenuStatus();
    if (novoStatus !== pedido.statusDoPedido) {
      this.atualizarStatus(pedido, novoStatus);
    }
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

  async atualizarStatus(pedido: PedidoUI, novoStatus: string) {
    const statusAnterior = pedido.statusDoPedido;

    // Cancelar devolve os itens ao estoque e não tem volta (o backend recusa mudar depois)
    if (novoStatus === 'CANCELADO') {
      const { isConfirmed } = await Swal.fire({
        title: `Cancelar o pedido #${pedido.id}?`,
        text: 'Os itens voltam para o estoque da loja. Depois de cancelado, o pedido não pode mudar de status.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Cancelar pedido',
        cancelButtonText: 'Voltar'
      });
      if (!isConfirmed) {
        return;
      }
    }

    pedido.statusDoPedido = novoStatus;
    this.cdr.detectChanges();

    this.service.atualizarStatus(pedido.id, novoStatus)
      .subscribe({
        next: () => {
          this.carregarContadores();
        },
        error: err => {
          pedido.statusDoPedido = statusAnterior;
          this.cdr.detectChanges();
          Swal.fire('Erro', err?.error?.message || 'Não foi possível atualizar o status do pedido.', 'error');
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
      tipoAtendimento: p.tipoAtendimento ?? null,
      observacao: p.observacao ?? '',
      selecionado: false
    };
  }
}
