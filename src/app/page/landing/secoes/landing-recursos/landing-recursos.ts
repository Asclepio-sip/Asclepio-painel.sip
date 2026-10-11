import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-recursos',
  templateUrl: './landing-recursos.html',
  styleUrl: './landing-recursos.css',
})
export class LandingRecursos {
  readonly recursos = [
    {
      icone: 'pdv',
      titulo: 'PDV / Frente de caixa',
      texto: 'Busque por nome ou código de barras, aplique descontos e feche a venda em segundos. Dinheiro, Pix e cartão no mesmo fluxo.',
    },
    {
      icone: 'estoque',
      titulo: 'Controle de estoque',
      texto: 'Entradas, saídas e baixa automática a cada venda. Alertas de estoque mínimo para você nunca perder uma venda por falta de produto.',
    },
    {
      icone: 'catalogo',
      titulo: 'Mini catálogo online',
      texto: 'Uma vitrine com o seu nome, suas cores e um link para mandar no WhatsApp e no Instagram. Preço e disponibilidade sempre iguais aos do caixa.',
    },
    {
      icone: 'pedidos',
      titulo: 'Pedidos e vendas',
      texto: 'Pedidos do catálogo chegam direto no painel. Acompanhe status, histórico e cada venda feita no balcão ou online.',
    },
    {
      icone: 'equipe',
      titulo: 'Equipe e permissões',
      texto: 'Cadastre operadores de caixa e gerentes, cada um com o acesso que precisa. Saiba quem vendeu o quê.',
    },
    {
      icone: 'relatorios',
      titulo: 'Relatórios',
      texto: 'Faturamento por dia, produtos mais vendidos e margem. Decida o que repor e o que promover com dados reais.',
    },
  ];
}
