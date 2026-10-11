import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-catalogo',
  templateUrl: './landing-catalogo.html',
  styleUrl: './landing-catalogo.css',
})
export class LandingCatalogo {
  readonly categorias = ['Todos', 'Pães', 'Bolos', 'Bebidas'];

  readonly produtos = [
    { nome: 'Bolo de milho', preco: 'R$ 24,00', cor: 'var(--lp-verde-medio)', esgotado: false },
    { nome: 'Café torrado 500g', preco: 'R$ 32,90', cor: '#F3EDE2', esgotado: false },
    { nome: 'Torta de frango', preco: '', cor: 'var(--lp-verde-claro)', esgotado: true },
  ];
}
