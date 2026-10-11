import { Component, OnInit, inject, signal } from '@angular/core';
import { Plano, RecursoPlano } from '../../../../models/plano.model';
import { PlanoService } from '../../../../service/plano.service';
import { LINK_WHATSAPP } from '../../landing-navegacao';

// "R$ 150" para valores inteiros e "R$ 99,90" para quebrados.
const moedaInteira = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

@Component({
  selector: 'app-landing-planos',
  templateUrl: './landing-planos.html',
  styleUrl: './landing-planos.css',
})
export class LandingPlanos implements OnInit {
  private planoService = inject(PlanoService);

  readonly linkCriarConta = LINK_WHATSAPP;

  // Planos vêm do back-end (GET /planos). Signals: a app é zoneless.
  planos = signal<Plano[]>([]);
  carregando = signal(true);
  erro = signal(false);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.planoService.listar().subscribe({
      next: (planos) => {
        this.planos.set(planos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  preco(valor: number): string {
    return Number.isInteger(valor) ? moedaInteira.format(valor) : moeda.format(valor);
  }

  textoBotao(plano: Plano): string {
    return plano.preco > 0 ? `Assinar ${plano.nome}` : 'Começar grátis';
  }

  /** "Funcionários: Até 5" ou só "Cashback". */
  textoRecurso(recurso: RecursoPlano): string {
    return recurso.detalhe ? `${recurso.nome}: ${recurso.detalhe}` : recurso.nome;
  }
}
