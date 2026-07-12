import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { PermissionGroups } from '../../core/security/permission-groups';
import { CategoriaService, Categoria } from '../../service/categoria.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements OnInit {

  isOpen = false;
  gestaoOpen = false;
  estoqueOpen = false;
  estoquePermissions = PermissionGroups.estoque;
  pedidoOpen = false;
  pedidoPermissions = PermissionGroups.pedidos;
  produtoOpen = false;
  gestaoPermissions = PermissionGroups.lojas;
  categoriasOpen = false;
  categorias: Categoria[] = [];

  showLogoutModal = false;
  closing = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private categoriaService: CategoriaService
  ) {
    this.gestaoOpen = this.isGestaoRoute();
    this.estoqueOpen = this.isEstoqueRoute();
    this.pedidoOpen = this.isPedidoRoute();
    this.produtoOpen = this.isProdutoRoute();
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.categoriaService.listar().subscribe({
        next: cats => this.categorias = cats,
        error: () => {}
      });
    }
  }

  abrirSidebar() {
    this.isOpen = true;
  }

  fecharSidebar() {
    this.isOpen = false;
  }

  toggleGestao() {
    this.gestaoOpen = !this.gestaoOpen;
  }

  toggleEstoque() {
    this.estoqueOpen = !this.estoqueOpen;
  }

  togglePedido() {
    this.pedidoOpen = !this.pedidoOpen;
  }

  toggleProduto() {
    this.produtoOpen = !this.produtoOpen;
  }

  toggleCategorias() {
    this.categoriasOpen = !this.categoriasOpen;
  }

  navegarCategoria(categoriaId: number) {
    this.router.navigate(['/products'], { queryParams: { categoriaId } });
  }

  private isEstoqueRoute() {
    return [
      '/addestoque',
      '/atualizar-estoque',
      '/relatorio-estoque'
    ].some(route => this.router.url.startsWith(route));
  }

  private isGestaoRoute() {
    return [
      '/loja',
      '/empresa',
      '/addloja',
      '/editar-loja',
      '/add-bairro'
    ].some(route => this.router.url.startsWith(route));
  }

  private isPedidoRoute() {
    return [
      '/pedido',
      '/pedidos',
      '/fazer-pedido'
    ].some(route => this.router.url.startsWith(route));
  }

  private isProdutoRoute() {
    return [
      '/products',
      '/addProduto',
      '/variacoes',
      '/addCategoria'
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
