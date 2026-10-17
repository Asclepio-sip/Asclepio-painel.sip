import { Component, OnInit, inject, signal } from '@angular/core';
import { ProductService } from '../../service/product.service';
import { RouterModule } from '@angular/router';
import { ListaDeLoja } from "./lista-de-loja/lista-de-loja";
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
  private planoService = inject(PlanoService);

  /** Signal (a app é zoneless). null enquanto carrega ou se falhar (aí não trava o botão: o backend valida de qualquer jeito). */
  plano = signal<PlanoEmpresa | null>(null);
  readonly linkTrocarPlano = LINK_WHATSAPP;

  ngOnInit() {
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

  /** "1/5" = 1 funcionário cadastrado de um limite de 5. */
  get usoFuncionarios(): string {
    const funcionarios = this.plano()?.funcionarios;
    if (!funcionarios) return '—';
    return `${funcionarios.usado}/${funcionarios.limite ?? '∞'}`;
  }

  get limiteFuncionariosAtingido(): boolean {
    return this.plano()?.funcionarios.atingido ?? false;
  }

  carregarPlano() {
    this.planoService.atual().subscribe({
      next: plano => this.plano.set(plano),
      error: () => this.plano.set(null),
    });
  }
}
