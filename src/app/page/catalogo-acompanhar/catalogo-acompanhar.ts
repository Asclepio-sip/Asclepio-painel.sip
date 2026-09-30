import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogoOnlineService } from '../../service/catalogo-online.service';
import {
  CODIGO_RASTREIO_REGEX, DESIGN_PADRAO, DesignCatalogo, PedidoRecente, PedidoStatusPublico, StatusPedido,
  lerPedidosRecentes, normalizarCodigoRastreio, normalizarDesign, variaveisTema
} from '../../models/catalogo-online.model';

interface Etapa {
  status: StatusPedido;
  titulo: string;
  descricao: string;
}

/**
 * Página pública para o cliente acompanhar o pedido: /catalogo/:nomeLink/acompanhar?codigo=XXX.
 * GET /pedidos/status/{codigo} só devolve código + status (sem dados do cliente).
 */
@Component({
  selector: 'app-catalogo-acompanhar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogo-acompanhar.html',
  styleUrl: './catalogo-acompanhar.css',
})
export class CatalogoAcompanhar implements OnInit {

  nomeLink = '';
  design: DesignCatalogo = { ...DESIGN_PADRAO };

  codigo = '';
  tentouBuscar = false;
  buscando = false;
  erro = '';
  resultado: PedidoStatusPublico | null = null;

  recentes: PedidoRecente[] = [];

  /** O backend não diz se é entrega ou retirada, por isso os textos servem para os dois. */
  readonly etapas: Etapa[] = [
    { status: 'AGUARDANDO', titulo: 'Pedido recebido', descricao: 'A loja recebeu seu pedido e vai confirmar em breve.' },
    { status: 'SEPARACAO', titulo: 'Em separação', descricao: 'Seus produtos estão sendo separados.' },
    { status: 'EM_TRANSITO', titulo: 'A caminho', descricao: 'O pedido saiu da loja.' },
    { status: 'CONCLUIDO', titulo: 'Concluído', descricao: 'Pedido entregue ou retirado.' },
  ];

  private readonly formatadorData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogoOnlineService: CatalogoOnlineService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    this.nomeLink = (this.route.snapshot.paramMap.get('nomeLink') ?? '').trim().toLowerCase();
    this.recentes = this.nomeLink ? lerPedidosRecentes(this.nomeLink) : [];

    if (this.nomeLink) {
      this.catalogoOnlineService.getDesignPublico(this.nomeLink).subscribe({
        next: design => {
          this.design = normalizarDesign(design);
          this.cd.detectChanges();
        },
        error: () => {}
      });
    }

    const codigo = this.route.snapshot.queryParamMap.get('codigo');
    if (codigo) {
      this.codigo = normalizarCodigoRastreio(codigo);
      this.buscar();
    } else if (this.recentes.length === 1) {
      // Só um pedido feito neste navegador: já mostra.
      this.codigo = this.recentes[0].codigo;
      this.buscar();
    }
  }

  get tema(): Record<string, string> {
    return variaveisTema(this.design);
  }

  get codigoValido(): boolean {
    return CODIGO_RASTREIO_REGEX.test(this.codigo);
  }

  get erroCodigo(): string {
    if (!this.tentouBuscar || this.codigoValido) return '';
    return this.codigo ? 'O código tem 20 letras e números.' : 'Informe o código do pedido.';
  }

  onCodigoDigitado() {
    this.codigo = normalizarCodigoRastreio(this.codigo).slice(0, 20);
    this.erro = '';
  }

  escolherRecente(codigo: string) {
    this.codigo = codigo;
    this.buscar();
  }

  buscar() {
    if (this.buscando) return;
    this.tentouBuscar = true;
    this.erro = '';
    if (!this.codigoValido) return;

    this.buscando = true;
    // Deixa o código na URL: dá pra atualizar a página ou mandar o link.
    this.router.navigate([], { relativeTo: this.route, queryParams: { codigo: this.codigo }, replaceUrl: true });

    this.catalogoOnlineService.consultarStatus(this.codigo).subscribe({
      next: res => {
        this.resultado = res;
        this.buscando = false;
        this.cd.detectChanges();
      },
      error: err => {
        this.resultado = null;
        this.buscando = false;
        const msg = typeof err.error?.message === 'string' ? err.error.message : '';
        if (err.status === 404) this.erro = 'Não encontramos nenhum pedido com esse código. Confira e tente de novo.';
        else if (err.status === 400) this.erro = msg || 'Não foi possível consultar este pedido.';
        else if (err.status === 0) this.erro = 'Sem conexão. Verifique sua internet e tente de novo.';
        else this.erro = 'Não foi possível consultar agora. Tente novamente.';
        this.cd.detectChanges();
      }
    });
  }

  /** Índice da etapa atual na linha do tempo (-1 = cancelado). */
  get indiceAtual(): number {
    return this.resultado ? this.etapas.findIndex(e => e.status === this.resultado!.status) : -1;
  }

  get cancelado(): boolean {
    return this.resultado?.status === 'CANCELADO';
  }

  dataRecente(iso: string): string {
    const data = new Date(iso);
    return isNaN(data.getTime()) ? '' : this.formatadorData.format(data);
  }
}
