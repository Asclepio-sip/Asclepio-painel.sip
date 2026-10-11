import { Component } from '@angular/core';
import { rolarParaSecao } from '../../landing-navegacao';

@Component({
  selector: 'app-landing-hero',
  templateUrl: './landing-hero.html',
  styleUrl: './landing-hero.css',
})
export class LandingHero {
  readonly ir = rolarParaSecao;

  readonly vantagens = ['Sem instalação', 'Funciona no celular e no computador', 'Cancele quando quiser'];

  readonly metricas = [
    { rotulo: 'Vendas hoje', valor: 'R$ 1.284' },
    { rotulo: 'Pedidos online', valor: '12' },
    { rotulo: 'Estoque baixo', valor: '3 itens', alerta: true },
  ];

  readonly itensCaixa = [
    { nome: 'Café torrado 500g', qtd: '2 × R$ 32,90' },
    { nome: 'Pão de queijo (kg)', qtd: '0,6 × R$ 44,00' },
    { nome: 'Suco natural 300ml', qtd: '1 × R$ 9,50' },
  ];

  readonly produtosCelular = [
    { nome: 'Café 500g', preco: 'R$ 32,90', cor: 'var(--lp-verde-claro)' },
    { nome: 'Bolo de milho', preco: 'R$ 24,00', cor: 'var(--lp-verde-medio)' },
    { nome: 'Pão francês', preco: 'R$ 0,90', cor: '#F3EDE2' },
    { nome: 'Suco 300ml', preco: 'R$ 9,50', cor: 'var(--lp-verde-claro)' },
  ];

  readonly destaques = [
    { titulo: 'PDV', texto: 'Frente de caixa rápida' },
    { titulo: 'Estoque', texto: 'Baixa automática a cada venda' },
    { titulo: 'Catálogo', texto: 'Sua vitrine online com link próprio' },
    { titulo: 'Multi-loja', texto: 'Várias unidades num só painel' },
  ];
}
