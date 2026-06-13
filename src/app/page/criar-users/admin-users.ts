import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Permission, Role, User } from '../../service/UserAdmin.service';
import { AddUsuario } from '../../shared/add-usuario/add-usuario';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { UserAdminService } from '../../service/UserAdmin.service';

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
  editRolePermissionIds: string[] = [];
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
    this.atualizarPermissoesDaRoleEdit();
    this.editPermissionIds = this.getUserExtraPermissionIds(user);
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
    const role = this.getRoleDoUsuario(user);

    if (role) {
      return role.nome;
    }

    if (typeof user.role === 'string') {
      return user.role;
    }

    if (typeof user.role === 'object' && !Array.isArray(user.role)) {
      return user.role.nome;
    }

    return user.roleName ?? 'Sem role';
  }

  getUserRoleId(user: User) {
    if (typeof user.role === 'object' && !Array.isArray(user.role)) {
      return user.role.id;
    }

    return user.roleId ?? this.getRoleDoUsuario(user)?.id ??
      this.roles.find(role => role.nome === user.role || role.nome === user.roleName)?.id ?? '';
  }

  getUserPermissionNames(user: User) {
    const permissions = user.permissions ?? [];

    if (permissions.length > 0) {
      return permissions.map(permission => permission.nome).join(', ');
    }

    return 'Sem permissoes';
  }

  toggleEditPermission(permissionId: string, event: Event) {
    if (this.isEditRolePermission(permissionId)) {
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.editPermissionIds = [...new Set([...this.editPermissionIds, permissionId])];
      return;
    }

    this.editPermissionIds = this.editPermissionIds.filter(id => id !== permissionId);
  }

  onEditRoleChange() {
    this.atualizarPermissoesDaRoleEdit();
    this.editPermissionIds = this.editPermissionIds
      .filter(id => !this.editRolePermissionIds.includes(id));
  }

  isEditPermissionSelected(permissionId: string) {
    return this.isEditRolePermission(permissionId) ||
      this.editPermissionIds.includes(permissionId);
  }

  isEditRolePermission(permissionId: string) {
    return this.editRolePermissionIds.includes(permissionId);
  }

  private atualizarPermissoesDaRoleEdit() {
    const role = this.roles.find(item => item.id === this.editRoleId);

    this.editRolePermissionIds =
      role?.permissions?.map(permission => permission.id) ?? [];
  }

  private getUserPermissionIds(user: User) {
    if (user.permissionIds) {
      return user.permissionIds;
    }

    return user.permissions?.map(permission => permission.id) ?? [];
  }

  private getUserExtraPermissionIds(user: User) {
    const explicitExtras = user.permissionIds ?? [];

    if (explicitExtras.length > 0) {
      return explicitExtras.filter(id => !this.editRolePermissionIds.includes(id));
    }

    return (user.permissions?.map(permission => permission.id) ?? [])
      .filter(id => !this.editRolePermissionIds.includes(id));
  }

  private getRoleDoUsuario(user: User) {
    const userPermissionIds =
      user.permissions?.map(permission => permission.id) ?? [];

    return this.roles
      .filter(role => role.permissions.length > 0)
      .map(role => ({
        role,
        matched: role.permissions.filter(permission =>
          userPermissionIds.includes(permission.id)
        ).length
      }))
      .filter(item => item.matched > 0)
      .sort((a, b) => b.matched - a.matched)[0]?.role;
  }
}
