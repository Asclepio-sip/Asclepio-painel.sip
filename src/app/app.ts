import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarAdministradorComponent } from './shared/navbar-administrador/navbar-administrador';
import { SidebarComponent } from './shared/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarAdministradorComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly publicRoutes = ['/login', '/landing', '/cadastro'];
  isPublicRoute = false;
  year = new Date().getFullYear();

  constructor(private router: Router) {
    this.isPublicRoute = this.isCurrentPublicRoute(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.isPublicRoute = this.isCurrentPublicRoute(e.urlAfterRedirects);
      });
  }

  private isCurrentPublicRoute(url: string) {
    const path = url.split('?')[0].split(';')[0];

    return this.publicRoutes.includes(path);
  }
}
