import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../service/UserAdmin.service';
import { AddUsuario } from '../../../shared/add-usuario/add-usuario';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { UserAdminService } from '../../../service/UserAdmin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AddUsuario, SidebarComponent],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {

  users: User[] = [];

  editUserId: string | null = null;
  editLogin = '';
  editPassword = '';
  editRole: 'ADMIN' | 'USER' = 'USER';

  

  constructor(private userService: UserAdminService,
    private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.carregarUsuarios();
  }

   carregarUsuarios() {
    this.userService.listarUsuarios().subscribe(users => {
      this.users = users;
      this.cd.detectChanges(); // 👈 ISSO RESOLVE
    });
  }
  editar(user: User) {
    this.editUserId = user.id;
    this.editLogin = user.login;
    this.editRole = user.role;
    this.editPassword = '';
  }

  salvar() {
    if (!this.editUserId) return;

    this.userService.atualizarUsuario(this.editUserId, {
      login: this.editLogin,
      password: this.editPassword || undefined,
      role: this.editRole
    }).subscribe(() => {
      alert('Usuário atualizado!');
      this.editUserId = null;
      this.carregarUsuarios();
    });
  }

  cancelar() {
    this.editUserId = null;
  }
}
