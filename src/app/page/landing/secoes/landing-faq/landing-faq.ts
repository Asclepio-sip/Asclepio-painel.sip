import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-faq',
  templateUrl: './landing-faq.html',
  styleUrl: './landing-faq.css',
})
export class LandingFaq {
  readonly perguntas = [
    {
      pergunta: 'Preciso instalar alguma coisa?',
      resposta: 'Não. O Asclepio funciona no navegador do computador, tablet ou celular. É só entrar com seu e-mail e senha.',
    },
    {
      pergunta: 'O catálogo online já vem pronto?',
      resposta: 'Sim. Ao criar sua loja, o catálogo é gerado com o seu link. Você só ajusta logo, cores e categorias, e os produtos cadastrados aparecem automaticamente.',
    },
    {
      pergunta: 'O estoque baixa sozinho quando vendo online?',
      resposta: 'Sim. Vendas do PDV e pedidos confirmados do catálogo dão baixa no mesmo estoque, então você nunca vende o que não tem.',
    },
    {
      pergunta: 'Posso trocar ou cancelar o plano?',
      resposta: 'Pode. Mude de plano ou cancele a qualquer momento pelo painel, sem multa.',
    },
  ];
}
