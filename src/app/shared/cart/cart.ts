import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../service/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {

  @Output() close = new EventEmitter<void>();

  constructor(public cartService: CartService,private router: Router) {}

  fechar() {
    this.close.emit();
  }

remover(produtoId: number, lojaId: number) {
  this.cartService.remove(
    produtoId,
    lojaId
  );
}

aumentar(produtoId: number, lojaId: number) {
  this.cartService.aumentar(
    produtoId,
    lojaId
  );
}

diminuir(produtoId: number, lojaId: number) {
  this.cartService.diminuir(
    produtoId,
    lojaId
  );
}
  
irParaLogin() {
  this.router.navigate(['/cestar']);
}
}
