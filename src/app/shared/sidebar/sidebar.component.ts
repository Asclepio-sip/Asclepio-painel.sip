import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { PermissionGroups } from '../../core/security/permission-groups';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {

  isOpen = false;
  estoqueOpen = false;
  estoquePermissions = PermissionGroups.estoque;
  pedidoOpen = false;
  pedidoPermissions = PermissionGroups.pedidos;

  showLogoutModal = false;
  closing = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.estoqueOpen = this.isEstoqueRoute();
    this.pedidoOpen = this.isPedidoRoute();
  }

  abrirSidebar() {
    this.isOpen = true;
  }

  fecharSidebar() {
    this.isOpen = false;
  }

  toggleEstoque() {
    this.estoqueOpen = !this.estoqueOpen;
  }

  togglePedido() {
    this.pedidoOpen = !this.pedidoOpen;
  }

  private isEstoqueRoute() {
    return [
      '/addestoque',
      '/atualizar-estoque',
      '/relatorio-estoque'
    ].some(route => this.router.url.startsWith(route));
  }

  private isPedidoRoute() {
    return [
      '/pedido',
      '/pedidos',
      '/fazer-pedido'
    ].some(route => this.router.url.startsWith(route));
  }

  abrirLogout() {
    this.showLogoutModal = true;
  }

  cancelarLogout() {
    this.closing = true;

    setTimeout(() => {
      this.showLogoutModal = false;
      this.closing = false;
    }, 250);
  }

  confirmarLogout() {
    this.closing = true;

    setTimeout(() => {
      this.authService.logout();
      location.href = '/';
    }, 250);
  }
}
