import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogoOnlineService } from '../../service/catalogo-online.service';
import {
  CatalogoCarrinhoItem, CatalogoCategoria, CatalogoLoja, CatalogoProduto, DESIGN_PADRAO, DesignCatalogo, gravarCarrinho, lerCarrinho, linkWhatsapp, normalizarDesign, variaveisTema
} from '../../models/catalogo-online.model';
import { CatalogoRodape } from '../../shared/catalogo-rodape/catalogo-rodape';
import { CatalogoCarrinhoComponent } from '../../shared/catalogo-carrinho/catalogo-carrinho';

type EstadoCatalogo = 'carregando' | 'ok' | 'indisponivel' | 'erro';

/**
 * Página pública (sem login) do catálogo: /catalogo/:nomeLink.
 * O link tem só o nome; a loja é escolhida aqui (automática quando a empresa tem uma só).
 */
@Component({
  selector: 'app-catalogo-publico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CatalogoRodape, CatalogoCarrinhoComponent],
  templateUrl: './catalogo-publico.html',
  styleUrl: './catalogo-publico.css',
})
export class CatalogoPublico implements OnInit, OnDestroy {

  nomeLink = '';
  lojas: CatalogoLoja[] = [];
  /** Modelo do card + rodapé. Se falhar, segue com o padrão e sem rodapé. */
  design: DesignCatalogo = { ...DESIGN_PADRAO };
  lojaId: number | null = null;
  estado: EstadoCatalogo = 'carregando';

  produtos: CatalogoProduto[] = [];
  categorias: CatalogoCategoria[] = [];

  nomeProduto = '';
  categoriaId: number | null = null;
  somentePromocao = false;

  /** Painel de categorias do modelo de navbar LOGO_BUSCA_BOTAO_CATEGORIAS. */
  categoriasAbertas = false;

  /** Carrinho da loja atual (cada loja tem o seu, guardado no navegador). */
  carrinho: CatalogoCarrinhoItem[] = [];
  carrinhoAberto = false;
  /** variacaoId que acabou de ser adicionado (feedback no botão do card). */
  adicionadoAgora: number | null = null;
  private adicionadoTimeout: ReturnType<typeof setTimeout> | undefined;

  paginaAtual = 0;
  totalPaginas = 1;
  totalElementos = 0;
  readonly tamanhoPagina = 20;

  private buscaTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogoOnlineService: CatalogoOnlineService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.nomeLink = (this.route.snapshot.paramMap.get('nomeLink') ?? '').trim().toLowerCase();

    if (!this.nomeLink) {
      this.estado = 'indisponivel';
      return;
    }

    this.carregarDesign();
    this.carregarCategorias();
    this.carregarLojas();
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

  /** Cores escolhidas no painel, aplicadas como variáveis CSS na página inteira (inclusive rodapé). */
  get tema(): Record<string, string> {
    return variaveisTema(this.design);
  }

  /** Nos modelos com busca no topo, a busca e as categorias saem da barra de filtros. */
  get buscaNoTopo(): boolean {
    return this.design.modeloNavbar !== 'PADRAO';
  }

  get nomeCategoriaAtual(): string {
    return this.categorias.find(c => c.id === this.categoriaId)?.nomeCategoria ?? '';
  }

  escolherCategoria(categoriaId: number | null) {
    this.categoriasAbertas = false;
    if (categoriaId === this.categoriaId) return;
    this.categoriaId = categoriaId;
    this.aplicarFiltros();
  }

  alternarCategorias(event: MouseEvent) {
    event.stopPropagation();
    this.categoriasAbertas = !this.categoriasAbertas;
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  fecharCategorias() {
    this.categoriasAbertas = false;
  }

  get linkBotaoWhatsapp(): string | null {
    return this.design.mostrarBotaoWhatsapp && this.design.whatsapp ? linkWhatsapp(this.design.whatsapp) : null;
  }

  get classeModelo(): string {
    return 'modelo-' + this.design.modeloCard.toLowerCase();
  }

  private carregarLojas() {
    this.estado = 'carregando';
    this.catalogoOnlineService.listarLojas(this.nomeLink).subscribe({
      next: lojas => {
        this.lojas = lojas;

        if (lojas.length === 0) {
          this.estado = 'indisponivel';
          this.cd.detectChanges();
          return;
        }

        // Volta da página de finalizar: ?loja= mantém a loja e ?carrinho=1 reabre a gaveta.
        const query = this.route.snapshot.queryParamMap;
        const lojaQuery = Number(query.get('loja'));
        this.lojaId = lojas.some(l => l.id === lojaQuery) ? lojaQuery : lojas[0].id;
        this.carregarCarrinho();
        this.carrinhoAberto = query.get('carrinho') === '1';
        this.buscar(0);
      },
      error: err => {
        this.estado = err.status === 404 ? 'indisponivel' : 'erro';
        this.cd.detectChanges();
      }
    });
  }

  get nomeLojaAtual(): string {
    return this.lojas.find(l => l.id === this.lojaId)?.nomeLoja ?? '';
  }

  trocarLoja(lojaId: number) {
    if (lojaId === this.lojaId) return;
    this.lojaId = lojaId;
    this.carregarCarrinho();
    this.buscar(0);
  }

  tentarNovamente() {
    if (this.lojaId) {
      this.buscar(this.paginaAtual);
    } else {
      this.carregarLojas();
    }
  }

  ngOnDestroy() {
    clearTimeout(this.buscaTimeout);
    clearTimeout(this.adicionadoTimeout);
  }

  // ── Carrinho ──

  private carregarCarrinho() {
    this.carrinho = this.lojaId ? lerCarrinho(this.nomeLink, this.lojaId) : [];
  }

  private salvarCarrinho() {
    if (this.lojaId) gravarCarrinho(this.nomeLink, this.lojaId, this.carrinho);
  }

  get quantidadeCarrinho(): number {
    return this.carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  }

  quantidadeNoCarrinho(produto: CatalogoProduto): number {
    return this.carrinho.find(i => i.variacaoId === produto.variacaoId)?.quantidade ?? 0;
  }

  /** Mesma variação soma na linha existente (o backend recusa variação repetida no pedido). */
  adicionarAoCarrinho(produto: CatalogoProduto) {
    const existente = this.carrinho.find(i => i.variacaoId === produto.variacaoId);
    if (existente) {
      existente.quantidade++;
      this.carrinho = [...this.carrinho];
    } else {
      this.carrinho = [...this.carrinho, {
        variacaoId: produto.variacaoId,
        nomeProduto: produto.nomeProduto,
        nomeVariacao: produto.nomeVariacao,
        imagemUrl: produto.imagemUrl,
        valorFinal: produto.valorFinal,
        quantidade: 1,
      }];
    }
    this.salvarCarrinho();

    this.adicionadoAgora = produto.variacaoId;
    clearTimeout(this.adicionadoTimeout);
    this.adicionadoTimeout = setTimeout(() => {
      this.adicionadoAgora = null;
      this.cd.detectChanges();
    }, 1200);
  }

  alterarQuantidade(evento: { variacaoId: number; quantidade: number }) {
    this.carrinho = evento.quantidade > 0
      ? this.carrinho.map(i => i.variacaoId === evento.variacaoId ? { ...i, quantidade: evento.quantidade } : i)
      : this.carrinho.filter(i => i.variacaoId !== evento.variacaoId);
    this.salvarCarrinho();
  }

  /** Formulário do pedido fica numa página própria; o carrinho vai junto pelo localStorage. */
  irParaFinalizar() {
    if (!this.lojaId || !this.carrinho.length) return;
    this.salvarCarrinho();
    this.router.navigate(['/catalogo', this.nomeLink, 'lojas', this.lojaId, 'finalizar']);
  }

  private carregarCategorias() {
    // Público e já filtrado (só ativas da empresa); o GET /categorias do painel exige login.
    this.catalogoOnlineService.listarCategorias(this.nomeLink).subscribe({
      next: categorias => {
        this.categorias = categorias ?? [];
        this.cd.detectChanges();
      },
      error: () => {}
    });
  }

  buscar(page: number) {
    if (!this.lojaId) return;

    this.estado = 'carregando';
    this.catalogoOnlineService.listarCatalogo(this.nomeLink, this.lojaId, {
      nomeProduto: this.nomeProduto,
      categoriaId: this.categoriaId,
      somentePromocao: this.somentePromocao
    }, page, this.tamanhoPagina).subscribe({
      next: res => {
        this.produtos = res.produtos;
        this.paginaAtual = res.number;
        this.totalPaginas = Math.max(1, res.totalPages);
        this.totalElementos = res.totalElements;
        this.estado = 'ok';
        this.cd.detectChanges();
      },
      error: err => {
        // 404 = nome não existe, catálogo desligado ou loja de outra empresa (sempre igual, de propósito)
        this.estado = err.status === 404 ? 'indisponivel' : 'erro';
        this.produtos = [];
        this.cd.detectChanges();
      }
    });
  }

  onBuscaNome() {
    clearTimeout(this.buscaTimeout);
    this.buscaTimeout = setTimeout(() => this.buscar(0), 400);
  }

  aplicarFiltros() {
    this.buscar(0);
  }

  get temFiltro(): boolean {
    return !!this.nomeProduto.trim() || !!this.categoriaId || this.somentePromocao;
  }

  limparFiltros() {
    this.nomeProduto = '';
    this.categoriaId = null;
    this.somentePromocao = false;
    this.buscar(0);
  }

  irParaPagina(page: number) {
    if (page < 0 || page >= this.totalPaginas || page === this.paginaAtual) return;
    this.buscar(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  titulo(produto: CatalogoProduto): string {
    return [produto.nomeProduto, produto.nomeVariacao].filter(Boolean).join(' — ');
  }

  private readonly formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  moeda(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '' : this.formatadorMoeda.format(valor);
  }

  descontoArredondado(produto: CatalogoProduto): number {
    return Math.round(produto.percentualDesconto ?? 0);
  }
}
