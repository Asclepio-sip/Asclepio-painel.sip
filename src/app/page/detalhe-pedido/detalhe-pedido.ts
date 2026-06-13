import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidosService, Pedido } from '../../service/pedidos.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { NavbarAdministradorComponent } from "../../shared/navbar-administrador/navbar-administrador";

@Component({
  selector: 'app-detalhe-pedido',
  standalone: true,
  imports: [CommonModule, SidebarComponent, NavbarAdministradorComponent],
  templateUrl: './detalhe-pedido.html',
  styleUrl: './detalhe-pedido.css'
})
export class DetalhePedido implements OnInit {

  pedido!: Pedido;

  constructor(
    private route: ActivatedRoute,
    private service: PedidosService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

statusEtapas = [
  { key: 'AGUARDANDO', label: 'Pedido Recebido' },
  { key: 'SEPARACAO', label: 'Em Separação' },
  { key: 'EM_TRANSITO', label: 'Em Trânsito' },
  { key: 'CONCLUIDO', label: 'Pedido Concluído' }
];

isEtapaAtiva(statusKey: string): boolean {

  const ordem = [
    'AGUARDANDO',
    'SEPARACAO',
    'EM_TRANSITO',
    'CONCLUIDO'
  ];

  const etapaAtual =
    ordem.indexOf(this.pedido.statusDoPedido);

  const etapa =
    ordem.indexOf(statusKey);

  return etapa <= etapaAtual;
}

ngOnInit() {

  const id = Number(
    this.route.snapshot.paramMap.get('id')
  );

  if (!id) {
    this.router.navigate(['/pedidos']);
    return;
  }

  this.service.buscarPorId(id)
    .subscribe({

      next: (res) => {

        console.log('PEDIDO API:', res);

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
          tipoEntrega: res.tipoEntrega,

          formaDePagamento:
            res.formaPagamento ?? '',

          cep: '',

          totalProdutos:
            res.totalProdutos,

          valorFrete:
            res.valorFrete,

          totalComFrete:
            res.totalFinal,

          freteGratis:
            res.freteGratis,

          itens: (res.itens ?? []).map((item: any) => ({
            nomeProduto:
              item.nomeProduto,

            quantidade:
              item.quantidade,

            preco:
              item.precoUnitario,

            subtotal:
              item.subtotal,
              
               percentualDesconto:
    item.percentualDesconto ?? 0,

              

imagemBase64:
item.imagemBase64
? `data:image/png;base64,${item.imagemBase64}`
: '',
            variacao: '',
            categoria: '',
            produtoId: 0
          }))
        };

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
        this.router.navigate(
          ['/pedidos']
        );
      }
    });
}
  voltar() {
    this.router.navigate(['/pedidos']);
  }

  falarWhatsApp() {
    const numero = this.pedido.telefone.replace(/\D/g, '');
    const mensagem = `Olá ${this.pedido.cliente}, seu pedido #${this.pedido.id} está sendo processado!`;
    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`, '_blank');
  }

calcularTotal(): number {
  return this.pedido.totalComFrete ?? 0;
}

  gerarPDF() {
    this.service.geraPdf(this.pedido.id).subscribe((blob: Blob) => {

      const fileURL = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = fileURL;
      link.download = `pedido-${this.pedido.id}.pdf`;
      link.click();

      window.URL.revokeObjectURL(fileURL);
    });
  }


  calcularSubtotal(item: any): number {
  return (item.preco ?? 0) * (item.quantidade ?? 0);
}
}