import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthService } from '../../service/auth.service';
import { PermissionGroups } from '../../core/security/permission-groups';
import { PlanoService } from '../../service/plano.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {

  estoquePermissions = PermissionGroups.estoque;
  pedidoPermissions = PermissionGroups.pedidos;
  gestaoPermissions = PermissionGroups.lojas;
  configContaPermissions = PermissionGroups.configConta;

  /** Plano inclui o cadastro de clientes. Começa true: se a consulta falhar, o backend ainda barra. */
  cadastroClientes = signal(true);

  constructor(
    public authService: AuthService,
    private planoService: PlanoService
  ) {
    if (this.authService.isAuthenticated()) {
      this.planoService.atual().subscribe({
        next: plano => this.cadastroClientes.set(plano.cadastroClientes),
        error: () => {}
      });
    }
  }

  sair() {
    Swal.fire({
      title: 'Sair da conta?',
      text: 'Você precisará fazer login novamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sair',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#5C6862'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        location.href = '/';
      }
    });
  }
}
