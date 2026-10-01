import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogoOnlineService } from '../../service/catalogo-online.service';
import {
  CatalogoBairro, CatalogoCarrinhoItem, CatalogoCheckout, CatalogoPedidoRequest, CatalogoPedidoResponse,
  DESIGN_PADRAO, DesignCatalogo, TipoAtendimentoCatalogo, gravarCarrinho, guardarPedidoRecente, lerCarrinho, normalizarDesign, variaveisTema
} from '../../models/catalogo-online.model';

type EstadoPagina = 'carregando' | 'ok' | 'indisponivel' | 'erro' | 'sucesso';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Página pública de finalizar pedido: /catalogo/:nomeLink/lojas/:lojaId/finalizar.
 * O carrinho vem do localStorage (montado na página do catálogo); aqui ficam dados, entrega e pagamento.
 */
@Component({
  selector: 'app-catalogo-finalizar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogo-finalizar.html',
  styleUrl: './catalogo-finalizar.css',
})
export class CatalogoFinalizar implements OnInit, OnDestroy {

  nomeLink = '';
  lojaId = 0;
  estado: EstadoPagina = 'carregando';

  design: DesignCatalogo = { ...DESIGN_PADRAO };
  checkout: CatalogoCheckout | null = null;
  itens: CatalogoCarrinhoItem[] = [];

  nomeCliente = '';
  telefone = '';
  email = '';
  tipoAtendimento: TipoAtendimentoCatalogo | null = null;
  bairroId: number | null = null;
  endereco = '';
  complemento = '';
  observacao = '';
  formaPagamento: string | null = null;

  tentouEnviar = false;
  enviando = false;
  erroEnvio = '';

  pedido: CatalogoPedidoResponse | null = null;
  /** Resumo guardado na hora do envio (o carrinho é limpo depois). */
  totalPedido = 0;
  codigoCopiado = false;

  readonly rotuloAtendimento: Record<TipoAtendimentoCatalogo, string> = {
    RETIRADA_NA_LOJA: 'Retirar na loja',
    ENTREGA_PROPRIA: 'Receber em casa',
  };

  private readonly formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private copiadoTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private route: ActivatedRoute,
    private catalogoOnlineService: CatalogoOnlineService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // O router não rola pro topo sozinho (sem withInMemoryScrolling) e o catálogo pode estar rolado.
    window.scrollTo(0, 0);
    this.nomeLink = (this.route.snapshot.paramMap.get('nomeLink') ?? '').trim().toLowerCase();
    this.lojaId = Number(this.route.snapshot.paramMap.get('lojaId'));

    if (!this.nomeLink || !Number.isInteger(this.lojaId) || this.lojaId <= 0) {
      this.estado = 'indisponivel';
      return;
    }

    this.itens = lerCarrinho(this.nomeLink, this.lojaId);
    this.carregarDesign();
    this.carregarCheckout();
  }

  ngOnDestroy() {
    clearTimeout(this.copiadoTimeout);
  }

  private carregarDesign() {
    this.catalogoOnlineService.getDesignPublico(this.nomeLink).subscribe({
      next: design => {
        this.design = normalizarDesign(design);
        this.cd.detectChanges();
      },
      error: () => {}
    });
  }

  carregarCheckout() {
    this.estado = 'carregando';
    this.catalogoOnlineService.getCheckout(this.nomeLink, this.lojaId).subscribe({
      next: checkout => {
        // Defesa: o backend já não manda BALCAO nem ENTREGA_TERCEIRIZADA.
        const tipos = (checkout.tiposAtendimento ?? []).filter(
          (t): t is TipoAtendimentoCatalogo => t === 'RETIRADA_NA_LOJA' || t === 'ENTREGA_PROPRIA'
        );
        this.checkout = {
          ...checkout,
          tiposAtendimento: tipos,
          bairros: checkout.bairros ?? [],
          formasPagamento: checkout.formasPagamento ?? [],
        };
        if (tipos.length === 1) this.tipoAtendimento = tipos[0];
        if (this.checkout.formasPagamento.length === 1) this.formaPagamento = this.checkout.formasPagamento[0].forma;
        this.estado = 'ok';
        this.cd.detectChanges();
      },
      error: err => {
        this.estado = err.status === 404 ? 'indisponivel' : 'erro';
        this.cd.detectChanges();
      }
    });
  }

  get tema(): Record<string, string> {
    return variaveisTema(this.design);
  }

  get nomeLoja(): string {
    return this.checkout?.nomeLoja ?? '';
  }

  /** Volta ao catálogo nesta loja; com carrinho=1 a gaveta já abre. */
  get queryVoltar() {
    return { loja: this.lojaId };
  }

  get queryEditarCarrinho() {
    return { loja: this.lojaId, carrinho: 1 };
  }

  // ── Valores (estimativa; o backend recalcula) ──

  get quantidadeTotal(): number {
    return this.itens.reduce((soma, item) => soma + item.quantidade, 0);
  }

  get subtotal(): number {
    return this.itens.reduce((soma, item) => soma + item.valorFinal * item.quantidade, 0);
  }

  get entrega(): boolean {
    return this.tipoAtendimento === 'ENTREGA_PROPRIA';
  }

  get bairroSelecionado(): CatalogoBairro | undefined {
    return this.checkout?.bairros.find(b => b.bairroId === this.bairroId);
  }

  get freteGratis(): boolean {
    const minimo = this.checkout?.valorMinimoFreteGratis;
    return minimo !== null && minimo !== undefined && this.subtotal >= minimo;
  }

  /** null = ainda não dá pra saber (entrega sem bairro escolhido). */
  get frete(): number | null {
    if (!this.entrega) return 0;
    const bairro = this.bairroSelecionado;
    if (!bairro) return null;
    return this.freteGratis ? 0 : bairro.valorFrete;
  }

  get total(): number {
    return this.subtotal + (this.frete ?? 0);
  }

  get faltaFreteGratis(): number | null {
    const minimo = this.checkout?.valorMinimoFreteGratis;
    if (!this.entrega || minimo === null || minimo === undefined || this.freteGratis) return null;
    return minimo - this.subtotal;
  }

  selecionarAtendimento(tipo: TipoAtendimentoCatalogo) {
    this.tipoAtendimento = tipo;
    this.erroEnvio = '';
  }

  // ── Validação ──

  get telefoneDigitos(): string {
    return this.telefone.replace(/\D/g, '');
  }

  get erros(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.nomeCliente.trim()) e['nome'] = 'Informe seu nome.';
    if (this.telefoneDigitos.length < 10 || this.telefoneDigitos.length > 11) e['telefone'] = 'Informe o telefone com DDD.';
    if (this.email.trim() && !EMAIL_REGEX.test(this.email.trim())) e['email'] = 'E-mail inválido.';
    if (!this.tipoAtendimento) e['atendimento'] = 'Escolha como quer receber.';
    if (this.entrega) {
      if (!this.bairroId) e['bairro'] = 'Escolha o bairro.';
      if (!this.endereco.trim()) e['endereco'] = 'Informe o endereço.';
    }
    if (!this.formaPagamento) e['pagamento'] = 'Escolha a forma de pagamento.';
    return e;
  }

  erro(campo: string): string {
    return this.tentouEnviar ? this.erros[campo] ?? '' : '';
  }

  formatarTelefoneDigitado() {
    const d = this.telefoneDigitos.slice(0, 11);
    if (d.length <= 2) this.telefone = d.length ? `(${d}` : '';
    else if (d.length <= 6) this.telefone = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    else if (d.length <= 10) this.telefone = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    else this.telefone = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  // ── Envio ──

  finalizar() {
    // Trava já no primeiro clique: evita pedido duplicado e gastar o limite de 5 por minuto.
    if (this.enviando || !this.checkout || !this.itens.length) return;

    this.tentouEnviar = true;
    this.erroEnvio = '';
    if (Object.keys(this.erros).length) {
      setTimeout(() => document.querySelector('.invalido, .msg-erro')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }

    const vazioNull = (v: string) => v.trim() || null;
    const pedido: CatalogoPedidoRequest = {
      nomeCliente: this.nomeCliente.trim(),
      telefone: this.telefoneDigitos,
      email: vazioNull(this.email),
      tipoAtendimentoPedido: this.tipoAtendimento!,
      bairroId: this.entrega ? this.bairroId : null,
      endereco: this.entrega ? vazioNull(this.endereco) : null,
      complemento: this.entrega ? vazioNull(this.complemento) : null,
      observacao: vazioNull(this.observacao),
      formaDePagamento: this.formaPagamento!,
      itens: this.itens.map(item => ({ variacaoId: item.variacaoId, quantidade: item.quantidade })),
    };

    this.enviando = true;
    const total = this.total;

    this.catalogoOnlineService.criarPedido(this.nomeLink, this.lojaId, pedido).subscribe({
      next: res => {
        this.pedido = res;
        this.totalPedido = total;
        this.itens = [];
        gravarCarrinho(this.nomeLink, this.lojaId, []);
        guardarPedidoRecente(this.nomeLink, res.codigoRastreio);
        this.enviando = false;
        this.estado = 'sucesso';
        this.cd.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: err => {
        this.enviando = false;
        this.erroEnvio = this.mensagemErro(err);
        this.cd.detectChanges();
      }
    });
  }

  private mensagemErro(err: { status: number; error?: { message?: string } }): string {
    const msg = typeof err.error?.message === 'string' ? err.error.message : '';
    switch (err.status) {
      case 0: return 'Sem conexão. Verifique sua internet e tente de novo.';
      case 429: return msg || 'Muitos pedidos em pouco tempo. Aguarde um minuto e tente novamente.';
      case 404: return 'Esta loja não está recebendo pedidos pelo catálogo no momento.';
      case 400: return msg || 'Confira os dados do pedido e tente novamente.';
      default: return 'Não foi possível enviar o pedido. Tente novamente.';
    }
  }

  copiarCodigo() {
    if (!this.pedido) return;
    navigator.clipboard?.writeText(this.pedido.codigoRastreio).then(() => {
      this.codigoCopiado = true;
      this.cd.detectChanges();
      clearTimeout(this.copiadoTimeout);
      this.copiadoTimeout = setTimeout(() => { this.codigoCopiado = false; this.cd.detectChanges(); }, 2000);
    }).catch(() => {});
  }

  moeda(valor: number): string {
    return this.formatadorMoeda.format(valor);
  }
}
