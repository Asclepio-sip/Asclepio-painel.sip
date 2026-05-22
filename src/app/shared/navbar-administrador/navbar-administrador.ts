import { AfterViewChecked, Component, OnInit, AfterViewInit} from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import {
  LucideAngularModule,
  Plus,
  UserCircle,
  LogOut
} from 'lucide-angular';

@Component({
  selector: 'app-navbar-administrador',
  standalone: true,
  imports: [RouterModule, CommonModule, LucideAngularModule],
  templateUrl: './navbar-administrador.html',
  styleUrl: './navbar-administrador.css',
})
export class NavbarAdministradorComponent implements OnInit {

  showLogoutModal = false;
  closing = false;


  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Inicialização do componente
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

  logout() {
    Swal.fire({
      title: 'Sair da conta?',
      text: 'Você precisará fazer login novamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sair',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        location.href = '/';
      }
    });
  }
}
