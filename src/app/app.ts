import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarAdministradorComponent } from './shared/navbar-administrador/navbar-administrador';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, HttpClientModule, CommonModule, NavbarAdministradorComponent, SidebarComponent],
  template: `
    <app-navbar-administrador *ngIf="!isLoginPage"></app-navbar-administrador>
    <div class="app-body" [class.with-sidebar]="!isLoginPage">
      <app-sidebar *ngIf="!isLoginPage"></app-sidebar>
      <div class="app-content">
        <main class="app-main">
          <router-outlet></router-outlet>
        </main>
        <footer class="app-footer" *ngIf="!isLoginPage">
          <div class="footer-top">
            <div class="footer-col footer-col-brand">
              <div class="footer-brand">
                <img src="logo-symbol.svg" alt="Asclepio" class="footer-logo" />
                <div>
                  <span class="footer-brand-name">ASCLEPIO</span>
                  <span class="footer-brand-sub">Painel Administrativo</span>
                </div>
              </div>
              <p class="footer-desc">
                Sistema integrado de gestão para controle de produtos,
                pedidos, estoque e lojas da rede PromoFarma.
              </p>
              <div class="footer-badges">
                <span class="footer-env">Produção</span>
                <span class="footer-version">v1.0.0</span>
              </div>
            </div>

            <div class="footer-col">
              <h4 class="footer-col-title">Catálogo</h4>
              <nav class="footer-nav">
                <a routerLink="/products" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                  Lista de Produtos
                </a>
                <a routerLink="/addProduto" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  Adicionar Produto
                </a>
                <a routerLink="/variacoes" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Variações
                </a>
                <a routerLink="/addCategoria" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                  Categorias
                </a>
              </nav>
            </div>

            <div class="footer-col">
              <h4 class="footer-col-title">Operações</h4>
              <nav class="footer-nav">
                <a routerLink="/pedido" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  Pedidos
                </a>
                <a routerLink="/addestoque" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                  Adicionar Estoque
                </a>
                <a routerLink="/atualizar-estoque" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                  Atualizar Estoque
                </a>
                <a routerLink="/relatorio-estoque" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  Relatório de Estoque
                </a>
              </nav>
            </div>

            <div class="footer-col">
              <h4 class="footer-col-title">Administração</h4>
              <nav class="footer-nav">
                <a routerLink="/loja" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                  Gestão de Lojas
                </a>
                <a routerLink="/add-bairro" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Bairros
                </a>
                <a routerLink="/AddUsuario" class="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  Usuários
                </a>
              </nav>
            </div>
          </div>

          <div class="footer-bottom">
            <span class="footer-copy">&copy; {{ year }} Asclepio Sistemas. Todos os direitos reservados.</span>
            <span class="footer-divider">·</span>
            <span class="footer-copy">Desenvolvido para a rede PromoFarma</span>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .app-body {
      display: flex;
      min-height: calc(100vh - 72px);
    }
    .app-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .app-main {
      flex: 1;
      overflow-x: hidden;
    }
    .app-footer {
      background: #ffffff;
      border-top: 1px solid #f0ebe4;
      flex-shrink: 0;
      font-family: 'Poppins', sans-serif;
    }
    .footer-top {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1fr;
      gap: 32px;
      padding: 36px 36px 28px;
      border-bottom: 1px solid #f3f4f6;
    }
    .footer-col-brand { display: flex; flex-direction: column; gap: 14px; }
    .footer-brand { display: flex; align-items: center; gap: 10px; }
    .footer-logo { height: 34px; width: auto; }
    .footer-brand-name { display: block; font-size: 13px; font-weight: 700; color: #20272E; letter-spacing: 2.5px; }
    .footer-brand-sub { display: block; font-size: 10px; color: #C5794E; letter-spacing: 1px; font-weight: 500; }
    .footer-desc { font-size: 12.5px; color: #6b7280; line-height: 1.6; margin: 0; }
    .footer-badges { display: flex; gap: 8px; align-items: center; }
    .footer-env { font-size: 11px; font-weight: 600; color: #C5794E; background: #fdf6f0; border: 1px solid #f0cdb0; border-radius: 99px; padding: 2px 10px; }
    .footer-version { font-size: 11px; color: #9ca3af; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 99px; padding: 2px 10px; font-family: monospace; }
    .footer-col { display: flex; flex-direction: column; gap: 12px; }
    .footer-col-title { font-size: 11.5px; font-weight: 700; color: #20272E; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; }
    .footer-nav { display: flex; flex-direction: column; gap: 8px; }
    .footer-link {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 13px; color: #6b7280; text-decoration: none;
      transition: color .15s; cursor: pointer;
    }
    .footer-link:hover { color: #C5794E; }
    .footer-link svg { color: #C5794E; flex-shrink: 0; }
    .footer-bottom {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 14px 36px;
      background: #fafafa;
    }
    .footer-copy { font-size: 12px; color: #9ca3af; }
    .footer-divider { color: #d1d5db; font-size: 14px; }
  `]
})
export class App {
  isLoginPage = false;
  year = new Date().getFullYear();

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.isLoginPage = e.urlAfterRedirects === '/login' || e.url === '/login';
      });
  }
}
