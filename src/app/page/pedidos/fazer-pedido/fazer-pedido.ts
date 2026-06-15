import { Component } from '@angular/core';
import { Navbar } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { ListaDeProduto } from '../../../shared/lista-de-produto/lista-de-produto';

@Component({
  selector: 'app-fazer-pedido',
  standalone: true,
  imports: [Navbar, SidebarComponent, ListaDeProduto],
  templateUrl: './fazer-pedido.html',
  styleUrl: './fazer-pedido.css',
})
export class FazerPedido {}
