import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Permission, Role, User } from '../../../service/UserAdmin.service';
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
  roles: Role[] = [];
  permissions: Permission[] = [];

  editUserId: string | null = null;
  editLogin = '';
  editPassword = '';
  editRoleId = '';
  editPermissionIds: string[] = [];
  loading = false;

  constructor(
    private userService: UserAdminService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarRoles();
    this.carregarPermissoes();
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.loading = true;

    this.userService.listarUsuarios().subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        alert('Erro ao carregar usuarios');
      }
    });
  }

  carregarRoles() {
    this.userService.listarRoles().subscribe({
      next: roles => {
        this.roles = roles;
        this.cd.detectChanges();
      },
      error: () => alert('Erro ao carregar roles')
    });
  }

  carregarPermissoes() {
    this.userService.listarPermissoes().subscribe({
      next: permissions => {
        this.permissions = permissions;
        this.cd.detectChanges();
      },
      error: () => alert('Erro ao carregar permissoes')
    });
  }

  editar(user: User) {
    this.editUserId = user.id;
    this.editLogin = user.login;
    this.editRoleId = this.getUserRoleId(user);
    this.editPassword = '';
    this.editPermissionIds = this.getUserPermissionIds(user);
  }

  salvar() {
    if (!this.editUserId) return;

    if (!this.editRoleId) {
      alert('Selecione uma role');
      return;
    }

    this.userService.atualizarUsuario(this.editUserId, {
      login: this.editLogin,
      password: this.editPassword || undefined,
      roleId: this.editRoleId,
      permissionIds: this.editPermissionIds
    }).subscribe({
      next: () => {
        alert('Usuario atualizado!');
        this.editUserId = null;
        this.carregarUsuarios();
      },
      error: () => alert('Erro ao atualizar usuario')
    });
  }

  cancelar() {
    this.editUserId = null;
  }

  getUserRoleName(user: User) {
    if (Array.isArray(user.role)) {
      return 'Permissoes diretas';
    }

    if (typeof user.role === 'string') {
      return user.role;
    }

    return user.role?.nome ?? user.roleName ?? 'Sem role';
  }

  getUserRoleId(user: User) {
    if (Array.isArray(user.role)) {
      return user.roleId ?? '';
    }

    if (typeof user.role === 'object') {
      return user.role.id;
    }

    return user.roleId ?? this.roles.find(role => role.nome === user.role || role.nome === user.roleName)?.id ?? '';
  }

  getUserPermissionNames(user: User) {
    const permissions = user.permissions ?? [];

    if (permissions.length > 0) {
      return permissions.map(permission => permission.nome).join(', ');
    }

    return 'Sem permissoes';
  }

  toggleEditPermission(permissionId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.editPermissionIds = [...new Set([...this.editPermissionIds, permissionId])];
      return;
    }

    this.editPermissionIds = this.editPermissionIds.filter(id => id !== permissionId);
  }

  private getUserPermissionIds(user: User) {
    if (user.permissionIds) {
      return user.permissionIds;
    }

    return user.permissions?.map(permission => permission.id) ?? [];
  }
}
