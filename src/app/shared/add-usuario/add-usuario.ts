import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Permission, Role, UserAdminService } from '../../service/UserAdmin.service';
import { of, switchMap } from 'rxjs';

type PermissionAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';

interface PermissionGroup {
  recurso: string;
  permissions: Partial<Record<PermissionAction, Permission>>;
  extras: Permission[];
}

@Component({
  selector: 'app-add-usuario',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-usuario.html',
  styleUrl: './add-usuario.css',
})
export class AddUsuario implements OnInit {

  @Output() usuarioCriado = new EventEmitter<void>();

  login = '';
  email = '';
  password = '';
  roleId = '';
  roles: Role[] = [];
  permissions: Permission[] = [];
  permissionGroups: PermissionGroup[] = [];
  selectedPermissionIds: string[] = [];
  rolePermissionIds: string[] = [];
  salvando = false;

  permissionActions: { key: PermissionAction; label: string }[] = [
    { key: 'VIEW', label: 'Ver' },
    { key: 'CREATE', label: 'Criar' },
    { key: 'UPDATE', label: 'Editar' },
    { key: 'DELETE', label: 'Excluir' }
  ];

  private readonly actionAliases: Record<string, PermissionAction> = {
    VER: 'VIEW',
    READ: 'VIEW',
    CRIAR: 'CREATE',
    CREATE: 'CREATE',
    EDITAR: 'UPDATE',
    ATUALIZAR: 'UPDATE',
    UPDATE: 'UPDATE',
    EXCLUIR: 'DELETE',
    DELETAR: 'DELETE',
    DELETE: 'DELETE'
  };

  constructor(private userService: UserAdminService) {}

  ngOnInit() {
    this.carregarRoles();
    this.carregarPermissoes();
  }

  carregarRoles() {
    this.userService.listarRoles().subscribe({
      next: roles => {
        this.roles = roles;
        this.roleId = this.roleId || roles[0]?.id || '';
        this.aplicarPermissoesDaRole();
      },
      error: () => alert('Erro ao carregar roles')
    });
  }

  carregarPermissoes() {
    this.userService.listarPermissoes().subscribe({
      next: permissions => {
        this.permissions = permissions;
        this.permissionGroups = this.agruparPermissoes(permissions);
      },
      error: () => alert('Erro ao carregar permissoes')
    });
  }

  onRoleChange() {
    this.aplicarPermissoesDaRole();
  }

  salvar() {
    if (!this.login || !this.email || !this.password || !this.roleId) {
      alert('Preencha login, email, senha e role');
      return;
    }

    this.salvando = true;

    this.userService.criarUsuario({
      login: this.login,
      Email: this.email,
      password: this.password,
      roleId: this.roleId,
      permissionIds: this.selectedPermissionIds
    }).pipe(
      switchMap(() =>
        this.userService.listarUsuarios(0, 20, { login: this.login })
      ),
      switchMap(response => {
        const usuarioCriado = response.users.find(user => user.login === this.login);

        if (!usuarioCriado || this.selectedPermissionIds.length === 0) {
          return of(null);
        }

        return this.userService.atualizarUsuario(usuarioCriado.id, {
          login: this.login,
          Email: this.email,
          roleId: this.roleId,
          permissionIds: this.selectedPermissionIds
        });
      })
    ).subscribe({
      next: () => {
        alert('Usuario criado com sucesso!');
        this.login = '';
        this.email = '';
        this.password = '';
        this.roleId = this.roles[0]?.id || '';
        this.aplicarPermissoesDaRole();
        this.salvando = false;
        this.usuarioCriado.emit();
      },
      error: err => {
        this.salvando = false;
        alert(err.error || 'Erro ao criar usuario');
      }
    });
  }

  getPermission(group: PermissionGroup, action: PermissionAction) {
    return group.permissions[action];
  }

  isPermissionSelected(permissionId: string) {
    return this.isRolePermission(permissionId) ||
      this.selectedPermissionIds.includes(permissionId);
  }

  isRolePermission(permissionId: string) {
    return this.rolePermissionIds.includes(permissionId);
  }

  togglePermission(permissionId: string, event: Event) {
    if (this.isRolePermission(permissionId)) {
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedPermissionIds = [...new Set([...this.selectedPermissionIds, permissionId])];
      return;
    }

    this.selectedPermissionIds = this.selectedPermissionIds.filter(id => id !== permissionId);
  }

  toggleGrupo(group: PermissionGroup, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.getGroupPermissionIds(group)
      .filter(id => !this.isRolePermission(id));

    if (checked) {
      this.selectedPermissionIds = [...new Set([...this.selectedPermissionIds, ...ids])];
      return;
    }

    this.selectedPermissionIds = this.selectedPermissionIds.filter(id => !ids.includes(id));
  }

  toggleTodasPermissoes(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const extraIds = this.permissions
      .map(permission => permission.id)
      .filter(id => !this.isRolePermission(id));

    if (checked) {
      this.selectedPermissionIds = extraIds;
      return;
    }

    this.selectedPermissionIds = [];
  }

  isGrupoSelecionado(group: PermissionGroup) {
    const ids = this.getGroupPermissionIds(group);

    return ids.length > 0 && ids.every(id => this.isPermissionSelected(id));
  }

  isGrupoParcial(group: PermissionGroup) {
    const ids = this.getGroupPermissionIds(group);

    return ids.some(id => this.isPermissionSelected(id)) && !this.isGrupoSelecionado(group);
  }

  isTudoSelecionado() {
    return this.permissions.length > 0 &&
      this.permissions.every(permission => this.isPermissionSelected(permission.id));
  }

  getTotalPermissoes() {
    return this.permissions.length;
  }

  getTotalSelecionadas() {
    return new Set([
      ...this.rolePermissionIds,
      ...this.selectedPermissionIds
    ]).size;
  }

  private aplicarPermissoesDaRole() {
    const role = this.roles.find(item => item.id === this.roleId);
    const roleIds = role?.permissions?.map(permission => permission.id) ?? [];

    this.rolePermissionIds = roleIds;
    this.selectedPermissionIds =
      this.selectedPermissionIds.filter(id => !roleIds.includes(id));
  }

  private agruparPermissoes(permissions: Permission[]) {
    const groups = new Map<string, PermissionGroup>();

    permissions.forEach(permission => {
      const { recurso, action } = this.lerPermissao(permission.nome);
      const group = groups.get(recurso) ?? {
        recurso,
        permissions: {},
        extras: []
      };

      if (action) {
        group.permissions[action] = permission;
      } else {
        group.extras.push(permission);
      }

      groups.set(recurso, group);
    });

    return Array.from(groups.values()).sort((a, b) => a.recurso.localeCompare(b.recurso));
  }

  private lerPermissao(nome: string) {
    const normalizedName = nome.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
    const parts = normalizedName.split('_').filter(Boolean);
    const first = parts[0];
    const last = parts[parts.length - 1];
    const prefixAction = this.actionAliases[first];
    const suffixAction = this.actionAliases[last];
    const action = prefixAction ?? suffixAction ?? null;
    const resourceParts = prefixAction
      ? parts.slice(1)
      : suffixAction
        ? parts.slice(0, -1)
        : parts;

    return {
      recurso: this.formatarRecurso(resourceParts.join('_') || nome),
      action
    };
  }

  private formatarRecurso(recurso: string) {
    return recurso
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getGroupPermissionIds(group: PermissionGroup) {
    return [
      ...Object.values(group.permissions),
      ...group.extras
    ].filter((permission): permission is Permission => !!permission)
      .map(permission => permission.id);
  }
}
