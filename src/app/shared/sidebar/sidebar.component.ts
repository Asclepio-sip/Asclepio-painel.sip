import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {

  isOpen = false;

  showLogoutModal = false;
  closing = false;

  constructor(public authService: AuthService) {}

  abrirSidebar() {
    this.isOpen = true;
  }

  fecharSidebar() {
    this.isOpen = false;
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
