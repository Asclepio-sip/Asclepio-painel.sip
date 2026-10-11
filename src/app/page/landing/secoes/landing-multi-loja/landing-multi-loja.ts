import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-multi-loja',
  templateUrl: './landing-multi-loja.html',
  styleUrl: './landing-multi-loja.css',
})
export class LandingMultiLoja {
  readonly lojas = [
    { nome: 'Loja Centro', status: 'Caixa aberto · Catálogo ativo', ativa: true },
    { nome: 'Loja Shopping', status: 'Caixa fechado · Catálogo ativo', ativa: false },
  ];
}
