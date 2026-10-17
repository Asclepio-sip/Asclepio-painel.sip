import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidosService, Pedido } from '../../service/pedidos.service';
import { FORMA_PAGAMENTO_LABELS } from '../../service/loja/forma-pagamento.service';

const ORDEM_STATUS = ['AGUARDANDO', 'SEPARACAO', 'EM_TRANSITO', 'CONCLUIDO'];

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO: 'Aguardando',
  SEPARACAO: 'Em separação',
  EM_TRANSITO: 'Em trânsito',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

/** Valores de TipoAtendimentoPedido no backend. */
const ATENDIMENTO_LABELS: Record<string, string> = {
  BALCAO: 'Balcão',
  RETIRADA_NA_LOJA: 'Retirada na loja',
  ENTREGA_PROPRIA: 'Entrega própria',
  ENTREGA_TERCEIRIZADA: 'Entrega terceirizada',
};

@Component({
  selector: 'app-detalhe-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalhe-pedido.html',
  styleUrl: './detalhe-pedido.css'
})
export class DetalhePedido implements OnInit {

  pedido!: Pedido;
  gerandoPdf = false;

  statusEtapas = [
    { key: 'AGUARDANDO', label: 'Pedido recebido' },
    { key: 'SEPARACAO', label: 'Em separação' },
    { key: 'EM_TRANSITO', label: 'Em trânsito' },
    { key: 'CONCLUIDO', label: 'Pedido concluído' }
  ];

  constructor(
    private route: ActivatedRoute,
    private service: PedidosService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.voltar();
      return;
    }

    this.service.buscarPorId(id).subscribe({
      next: (res) => {
        this.pedido = {
          id: res.id,

          cliente: res.nomeCliente,
          telefone: res.telefone,
          email: res.email,

          endereco: res.endereco,
          bairro: res.bairro,
          complemento: res.complemento,
          observacao: res.observacao,

          criado: res.criadoEm,

          statusDoPedido: res.status,
          tipoEntrega: res.tipoAtendimento ?? res.tipoEntrega ?? '',
          formaDePagamento: res.formaDePagamento ?? res.formaPagamento ?? '',

          cep: '',

          totalProdutos: res.totalProdutos,
          valorFrete: res.valorFrete,
          totalComFrete: res.totalFinal,
          freteGratis: res.freteGratis,

          itens: (res.itens ?? []).map((item: any) => ({
            produtoId: item.produtoId ?? 0,
            variacaoId: item.variacaoId ?? 0,
            nomeProduto: item.nomeProduto,
            variacao: item.variacao ?? item.nomeVariacao ?? '',
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            preco: item.precoUnitario,
            subtotal: item.subtotal,
            percentualDesconto: item.percentualDesconto ?? 0,
            imagemUrl:
              item.imagemUrl ??
              (item.imagemBase64 ? `data:image/png;base64,${item.imagemBase64}` : ''),
            imagemBase64:
              item.imagemUrl ??
              (item.imagemBase64 ? `data:image/png;base64,${item.imagemBase64}` : ''),
            categoria: item.categoria ?? ''
          }))
        };

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.voltar();
      }
    });
  }

  get cancelado(): boolean {
    return this.pedido.statusDoPedido === 'CANCELADO';
  }

  get statusLabel(): string {
    return STATUS_LABELS[this.pedido.statusDoPedido] ?? this.pedido.statusDoPedido;
  }

  get atendimentoLabel(): string {
    const tipo = this.pedido.tipoEntrega ?? '';
    return ATENDIMENTO_LABELS[tipo] ?? (tipo || 'Não informado');
  }

  get pagamentoLabel(): string {
    const forma = this.pedido.formaDePagamento;
    return FORMA_PAGAMENTO_LABELS[forma] ?? (forma || 'Não informada');
  }

  /** Só mostra endereço/bairro quando o pedido é de entrega. */
  get ehEntrega(): boolean {
    return (this.pedido.tipoEntrega ?? '').startsWith('ENTREGA');
  }

  get totalItens(): number {
    return this.pedido.itens.reduce((total, item) => total + (item.quantidade ?? 0), 0);
  }

  get telefoneWhatsApp(): string {
    return (this.pedido.telefone ?? '').replace(/\D/g, '');
  }

  etapaConcluida(statusKey: string): boolean {
    if (this.cancelado) return false;
    return ORDEM_STATUS.indexOf(statusKey) < ORDEM_STATUS.indexOf(this.pedido.statusDoPedido);
  }

  etapaAtual(statusKey: string): boolean {
    return !this.cancelado && statusKey === this.pedido.statusDoPedido;
  }

  voltar() {
    this.router.navigate(['/pedido']);
  }

  falarWhatsApp() {
    if (!this.telefoneWhatsApp) return;
    const mensagem = `Olá ${this.pedido.cliente}, seu pedido #${this.pedido.id} está sendo processado!`;
    window.open(`https://wa.me/55${this.telefoneWhatsApp}?text=${encodeURIComponent(mensagem)}`, '_blank');
  }

  gerarPDF() {
    this.gerandoPdf = true;
    this.service.geraPdf(this.pedido.id).subscribe({
      next: (blob: Blob) => {
        const fileURL = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = fileURL;
        link.download = `pedido-${this.pedido.id}.pdf`;
        link.click();

        window.URL.revokeObjectURL(fileURL);
        this.gerandoPdf = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.gerandoPdf = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularSubtotal(item: any): number {
    return (item.precoUnitario ?? item.preco ?? 0) * (item.quantidade ?? 0);
  }
}
