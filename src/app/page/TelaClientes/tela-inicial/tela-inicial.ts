import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { ProductService, Product } from '../../../service/product.service';
import { Navbar } from '../../../shared/navbar/navbar';
import { ListaDeProduto } from "../../../shared/lista-de-produto/lista-de-produto"; // 👈 AQUI

@Component({
  selector: 'app-tela-inicial',
  standalone: true,
  imports: [CommonModule, Navbar, ListaDeProduto],
  templateUrl: './tela-inicial.html',
  styleUrl: './tela-inicial.css',
})
export class TelaInicial {

  products$!: Observable<Product[]>;

  constructor(private productService: ProductService) {
    this.products$ = this.productService.products$;
  }
}
