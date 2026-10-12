import { Component, OnInit, inject, signal } from '@angular/core';
import { ProductService } from '../../service/product.service';
import { RouterModule } from '@angular/router';
import { ListaDeLoja } from "./lista-de-loja/lista-de-loja";
import { forkJoin } from 'rxjs';
import { LojaService, PageResponse, Loja } from '../../service/loja/loja.service';
import { PlanoService } from '../../service/plano.service';
import { PlanoEmpresa } from '../../models/plano.model';
import { LINK_WHATSAPP } from '../landing/landing-navegacao';

@Component({
  selector: 'app-gestao-de-loja',
  imports: [RouterModule, ListaDeLoja],
  templateUrl: './gestao-de-loja.html',
  styleUrl: './gestao-de-loja.css',
})
export class GestaoDeLoja implements OnInit {

  private productService = inject(ProductService);
  private lojaService = inject(LojaService);
  private planoService = inject(PlanoService);

  // Signals: a app é zoneless.
  totalEntrega = signal(0);
  totalRetirada = signal(0);
  totalAmbos = signal(0);

  /** null enquanto carrega ou se falhar (aí não trava o botão: o backend valida de qualquer jeito). */
  plano = signal<PlanoEmpresa | null>(null);
  readonly linkTrocarPlano = LINK_WHATSAPP;

  ngOnInit() {
    this.carregarResumoLojas();
    this.carregarPlano();
  }

  onSearch(value: string) {
    this.productService.setSearch(value);
  }

  /** "1/1", "2/3" ou "2/∞". */
  get usoLojas(): string {
    const lojas = this.plano()?.lojas;
    if (!lojas) return '—';
    return `${lojas.usado}/${lojas.limite ?? '∞'}`;
  }

  get limiteLojasAtingido(): boolean {
    return this.plano()?.lojas.atingido ?? false;
  }

  carregarPlano() {
    this.planoService.atual().subscribe({
      next: plano => this.plano.set(plano),
      error: () => this.plano.set(null),
    });
  }

  carregarResumoLojas() {
    forkJoin({
      entrega: this.lojaService.listar(0, 1, { tipoAtendimento: 'ENTREGA' }),
      retirada: this.lojaService.listar(0, 1, { tipoAtendimento: 'RETIRADA' }),
      ambos: this.lojaService.listar(0, 1, { tipoAtendimento: 'AMBOS' }),
    }).subscribe({
      next: ({ entrega, retirada, ambos }) => {
        this.totalEntrega.set(this.obterTotalElementos(entrega));
        this.totalRetirada.set(this.obterTotalElementos(retirada));
        this.totalAmbos.set(this.obterTotalElementos(ambos));
      },
      error: () => {
        this.totalEntrega.set(0);
        this.totalRetirada.set(0);
        this.totalAmbos.set(0);
      }
    });
  }

  private obterTotalElementos(response: PageResponse<Loja>): number {
    return response.page?.totalElements ?? response.totalElements ?? response.content?.length ?? 0;
  }
}
