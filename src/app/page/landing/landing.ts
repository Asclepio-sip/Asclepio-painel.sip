import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {
  currentYear = new Date().getFullYear();
 
  features = [
    {
      icon: 'box',
      title: 'Produtos & Estoque',
      desc: 'Cadastro completo de produtos e variações, com controle de inventário em tempo real e alertas de estoque baixo.',
    },
    {
      icon: 'check',
      title: 'Pedidos',
      desc: 'Acompanhe cada pedido do recebimento à entrega, com status atualizado e histórico completo.',
    },
    {
      icon: 'store',
      title: 'Gestão de Lojas',
      desc: 'Cadastre lojas, bairros de entrega e funcionários, e organize permissões por unidade.',
    },
    {
      icon: 'chart',
      title: 'Relatórios',
      desc: 'Visualize a movimentação de estoque, vendas e desempenho de cada loja em relatórios claros.',
    },
    {
      icon: 'users',
      title: 'Usuários & Permissões',
      desc: 'Controle quem acessa o quê, com perfis e funções configuráveis para cada colaborador.',
    },
  ];
 
  steps = [
    {
      number: '01',
      title: 'Cadastre sua rede',
      desc: 'Adicione lojas, produtos e equipe em poucos minutos.',
    },
    {
      number: '02',
      title: 'Organize o dia a dia',
      desc: 'Gerencie estoque e pedidos em um painel único, sem planilhas.',
    },
    {
      number: '03',
      title: 'Acompanhe os números',
      desc: 'Relatórios em tempo real para decidir com dados, não achismo.',
    },
  ];
}