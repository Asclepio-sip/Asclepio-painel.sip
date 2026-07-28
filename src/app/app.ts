import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarAdministradorComponent } from './shared/navbar-administrador/navbar-administrador';
import { SidebarComponent } from './shared/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, NavbarAdministradorComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly publicRoutes = ['/login', '/landing', '/cadastro'];
  private readonly rotaSemBotaoPedido = '/fazer-pedido';
  isPublicRoute = false;
  mostrarBotaoNovoPedido = false;
  year = new Date().getFullYear();

  constructor(private router: Router) {
    this.atualizarEstadoRota(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.atualizarEstadoRota(e.urlAfterRedirects);
      });
  }

  private atualizarEstadoRota(url: string) {
    const path = url.split('?')[0].split(';')[0];

    this.isPublicRoute = this.publicRoutes.includes(path);
    this.mostrarBotaoNovoPedido = !this.isPublicRoute && !path.startsWith(this.rotaSemBotaoPedido);
  }
}
