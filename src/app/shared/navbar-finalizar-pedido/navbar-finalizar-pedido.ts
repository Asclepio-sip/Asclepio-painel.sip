import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Cart } from '../cart/cart';
import { CartService } from '../../service/cart.service';
declare const lucide: any;

@Component({
  selector: 'app-navbar-finalizar-pedido',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './navbar-finalizar-pedido.html',
  styleUrl: './navbar-finalizar-pedido.css',
})
export class NavbarFinalizarPedido {

  constructor(
    private router: Router,
    public cartService: CartService
  ) {}


  @Input() activeStep: number = 1;
  @Input() showStepper: boolean = true;
  @Input() showCart: boolean = true;

  
  activeCategory = '';
  showMenu = false;

  ngOnInit() {
    this.initIcons();
  }

  ngAfterViewChecked() {
    this.initIcons();
  }

  initIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  setActive(category: string) {
    this.activeCategory = category;
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
    setTimeout(() => this.initIcons(), 50);
  }


  abrirCarrinho() {
    this.showCart = true;
  }

  telaInicial() {
    this.router.navigate(['/']);
  }
}
