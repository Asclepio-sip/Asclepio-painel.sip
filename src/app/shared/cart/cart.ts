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

remover(variacaoId: number, lojaId: number) {
  this.cartService.remove(
    variacaoId,
    lojaId
  );
}

aumentar(variacaoId: number, lojaId: number) {
  this.cartService.aumentar(
    variacaoId,
    lojaId
  );
}

diminuir(variacaoId: number, lojaId: number) {
  this.cartService.diminuir(
    variacaoId,
    lojaId
  );
}
  
irParaLogin() {
  this.router.navigate(['/cestar']);
}
}
