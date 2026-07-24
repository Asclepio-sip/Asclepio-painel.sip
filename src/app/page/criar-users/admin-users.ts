import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Permission, Role, User } from '../../service/UserAdmin.service';
import { UserAdminService } from '../../service/UserAdmin.service';
import { forkJoin, of, switchMap } from 'rxjs';

type PermissionAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';

interface PermissionGroup {
  recurso: string;
  permissions: Partial<Record<PermissionAction, Permission>>;
  extras: Permission[];
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {

  users: User[] = [];
  roles: Role[] = [];
  permissions: Permission[] = [];
  adminCount = 0;

  // Editar
  editUserId: string | null = null;
  editLogin = '';
  editEmail = '';
  editPassword = '';
  editRoleId = '';
  editPermissionIds: string[] = [];
  editRolePermissionIds: string[] = [];
  editPermissionGroups: PermissionGroup[] = [];

  // Criar
  showCriarModal = false;
  criarLogin = '';
  criarEmail = '';
  criarPassword = '';
  criarRoleId = '';
  criarPermissionIds: string[] = [];
  criarRolePermissionIds: string[] = [];
  criarPermissionGroups: PermissionGroup[] = [];
  salvandoCriar = false;

  loading = false;

  // Filtros e paginaÃ§Ã£o
  searchTerm = '';
  sortBy = 'recente';
  filterRole = '';
  showFiltros = false;
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  private buscaTimeout: any;

  // Tabela de permissÃµes
  permissionActions: { key: PermissionAction; label: string }[] = [
    { key: 'VIEW', label: 'Ver' },
    { key: 'CREATE', label: 'Criar' },
    { key: 'UPDATE', label: 'Editar' },
    { key: 'DELETE', label: 'Excluir' }
  ];

  private readonly actionAliases: Record<string, PermissionAction> = {
    VER: 'VIEW', READ: 'VIEW',
    CRIAR: 'CREATE', CREATE: 'CREATE',
    EDITAR: 'UPDATE', ATUALIZAR: 'UPDATE', UPDATE: 'UPDATE',
    EXCLUIR: 'DELETE', DELETAR: 'DELETE', DELETE: 'DELETE'
  };

  private readonly avatarColors = ['#dc2626', '#059669', '#7c3aed', '#d97706', '#2563eb', '#db2777', '#0891b2'];

  constructor(
    private userService: UserAdminService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarRoles();
    this.carregarPermissoes();
    this.carregarUsuarios(0);
  }

  carregarUsuarios(page: number = 0) {
    this.loading = true;

    this.userService.listarUsuarios(page, this.pageSize, {
      login: this.searchTerm.trim() || undefined,
      nomeRole: this.filterRole || undefined,
      sort: this.sortBy === 'nome' ? 'username,asc' : undefined
    }).subscribe({
      next: response => {
        this.users = response.users;
        this.totalElements = response.totalElements;
        this.totalPages = Math.max(1, response.totalPages);
        this.currentPage = response.number + 1;
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
        this.atualizarAdminCount();
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

  // â”€â”€ Filtros, busca e paginaÃ§Ã£o â”€â”€

  filtrarUsuarios() {
    clearTimeout(this.buscaTimeout);
    this.buscaTimeout = setTimeout(() => {
      this.carregarUsuarios(0);
    }, 400);
  }

  toggleFiltros() {
    this.showFiltros = !this.showFiltros;
  }

  abrirModalCriar() {
    this.showCriarModal = true;
    this.criarLogin = '';
    this.criarEmail = '';
    this.criarPassword = '';
    this.criarRoleId = this.roles[0]?.id || '';
    this.criarPermissionIds = [];
    this.aplicarPermissoesDaRoleCriar();
    this.criarPermissionGroups = this.agruparPermissoes(this.permissions);
  }

  fecharModalCriar() {
    this.showCriarModal = false;
  }

  // â”€â”€ KPIs â”€â”€

  private atualizarAdminCount() {
    const adminRoles = this.roles.filter(r => /ADMIN|SUPER/i.test(r.nome));

    if (adminRoles.length === 0) {
      this.adminCount = 0;
      return;
    }

    forkJoin(
      adminRoles.map(role => this.userService.listarUsuarios(0, 1, { roleId: role.id }))
    ).subscribe({
      next: respostas => {
        this.adminCount = respostas.reduce((soma, r) => soma + r.totalElements, 0);
        this.cd.detectChanges();
      },
      error: () => {}
    });
  }

  // â”€â”€ Avatar & Visual helpers â”€â”€

  getAvatarColor(user: User): string {
    const index = user.login.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getRoleBadgeClass(user: User): string {
    const roleName = this.getUserRoleName(user).toUpperCase();
    if (roleName.includes('SUPER')) return 'role-superadmin';
    if (roleName.includes('ADMIN')) return 'role-admin';
    if (roleName.includes('OPERADOR')) return 'role-operador';
    return 'role-default';
  }

  getUserPermissionCount(user: User): number {
    return user.totalPermissoes ?? user.permissions?.length ?? 0;
  }

  getPermissionPercent(user: User): number {
    if (!this.permissions.length) return 0;
    return (this.getUserPermissionCount(user) / this.permissions.length) * 100;
  }

  getPermissionBarColor(user: User): string {
    const percent = this.getPermissionPercent(user);
    if (percent >= 80) return '#059669';
    if (percent >= 40) return '#d97706';
    return '#dc2626';
  }

  // â”€â”€ Pagination â”€â”€

  get paginatedUsers(): User[] {
    return this.users;
  }

  getPageStart(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalElements);
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  getPages(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.carregarUsuarios(page - 1);
    }
  }

  // â”€â”€ EdiÃ§Ã£o â”€â”€

  editar(user: User) {
    this.editUserId = user.id;
    this.editLogin = user.login;
    this.editEmail = user.email ?? '';
    this.editRoleId = this.getUserRoleId(user);
    this.editPassword = '';
    this.atualizarPermissoesDaRoleEdit();
    this.editPermissionIds = this.getUserExtraPermissionIds(user);
    this.editPermissionGroups = this.agruparPermissoes(this.permissions);
  }

  salvar() {
    if (!this.editUserId) return;

    if (!this.editRoleId) {
      alert('Selecione uma role');
      return;
    }

    if (!this.editEmail) {
      alert('Informe o email');
      return;
    }

    this.userService.atualizarUsuario(this.editUserId, {
      login: this.editLogin,
      Email: this.editEmail,
      password: this.editPassword || undefined,
      roleId: this.editRoleId,
      permissionIds: this.editPermissionIds
    }).subscribe({
      next: () => {
        alert('Usuario atualizado!');
        this.editUserId = null;
        this.atualizarAdminCount();
        this.carregarUsuarios(this.currentPage - 1);
      },
      error: () => alert('Erro ao atualizar usuario')
    });
  }

  cancelar() {
    this.editUserId = null;
  }

  // â”€â”€ Permission Table (shared) â”€â”€

  getPermission(group: PermissionGroup, action: PermissionAction) {
    return group.permissions[action];
  }

  // â”€â”€ Edit Permission Table â”€â”€

  getEditTotalSelecionadas(): number {
    return new Set([...this.editRolePermissionIds, ...this.editPermissionIds]).size;
  }

  isEditTudoSelecionado(): boolean {
    return this.permissions.length > 0 &&
      this.permissions.every(p => this.isEditPermissionSelected(p.id));
  }

  toggleEditTodasPermissoes(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const extraIds = this.permissions.map(p => p.id).filter(id => !this.isEditRolePermission(id));
    this.editPermissionIds = checked ? extraIds : [];
  }

  isEditGrupoSelecionado(group: PermissionGroup): boolean {
    const ids = this.getGroupPermissionIds(group);
    return ids.length > 0 && ids.every(id => this.isEditPermissionSelected(id));
  }

  isEditGrupoParcial(group: PermissionGroup): boolean {
    const ids = this.getGroupPermissionIds(group);
    return ids.some(id => this.isEditPermissionSelected(id)) && !this.isEditGrupoSelecionado(group);
  }

  toggleEditGrupo(group: PermissionGroup, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.getGroupPermissionIds(group).filter(id => !this.isEditRolePermission(id));
    if (checked) {
      this.editPermissionIds = [...new Set([...this.editPermissionIds, ...ids])];
    } else {
      this.editPermissionIds = this.editPermissionIds.filter(id => !ids.includes(id));
    }
  }

  // â”€â”€ Criar UsuÃ¡rio â”€â”€

  criarUsuario() {
    if (!this.criarLogin || !this.criarEmail || !this.criarPassword || !this.criarRoleId) {
      alert('Preencha login, email, senha e role');
      return;
    }

    this.salvandoCriar = true;

    this.userService.criarUsuario({
      login: this.criarLogin,
      Email: this.criarEmail,
      password: this.criarPassword,
      roleId: this.criarRoleId,
      permissionIds: this.criarPermissionIds
    }).pipe(
      switchMap(() => this.userService.listarUsuarios(0, 20, { login: this.criarLogin })),
      switchMap(response => {
        const usuarioCriado = response.users.find(u => u.login === this.criarLogin);
        if (!usuarioCriado || this.criarPermissionIds.length === 0) return of(null);
        return this.userService.atualizarUsuario(usuarioCriado.id, {
          login: this.criarLogin,
          Email: this.criarEmail,
          roleId: this.criarRoleId,
          permissionIds: this.criarPermissionIds
        });
      })
    ).subscribe({
      next: () => {
        alert('UsuÃ¡rio criado com sucesso!');
        this.showCriarModal = false;
        this.salvandoCriar = false;
        this.atualizarAdminCount();
        this.carregarUsuarios(0);
      },
      error: (err) => {
        this.salvandoCriar = false;
        alert(err.error || 'Erro ao criar usuÃ¡rio');
      }
    });
  }

  onCriarRoleChange() {
    this.aplicarPermissoesDaRoleCriar();
    this.criarPermissionIds = this.criarPermissionIds.filter(id => !this.criarRolePermissionIds.includes(id));
  }

  isCriarPermissionSelected(permissionId: string): boolean {
    return this.isCriarRolePermission(permissionId) || this.criarPermissionIds.includes(permissionId);
  }

  isCriarRolePermission(permissionId: string): boolean {
    return this.criarRolePermissionIds.includes(permissionId);
  }

  toggleCriarPermission(permissionId: string, event: Event) {
    if (this.isCriarRolePermission(permissionId)) return;
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.criarPermissionIds = [...new Set([...this.criarPermissionIds, permissionId])];
    } else {
      this.criarPermissionIds = this.criarPermissionIds.filter(id => id !== permissionId);
    }
  }

  getCriarTotalSelecionadas(): number {
    return new Set([...this.criarRolePermissionIds, ...this.criarPermissionIds]).size;
  }

  isCriarTudoSelecionado(): boolean {
    return this.permissions.length > 0 &&
      this.permissions.every(p => this.isCriarPermissionSelected(p.id));
  }

  toggleCriarTodasPermissoes(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const extraIds = this.permissions.map(p => p.id).filter(id => !this.isCriarRolePermission(id));
    this.criarPermissionIds = checked ? extraIds : [];
  }

  isCriarGrupoSelecionado(group: PermissionGroup): boolean {
    const ids = this.getGroupPermissionIds(group);
    return ids.length > 0 && ids.every(id => this.isCriarPermissionSelected(id));
  }

  isCriarGrupoParcial(group: PermissionGroup): boolean {
    const ids = this.getGroupPermissionIds(group);
    return ids.some(id => this.isCriarPermissionSelected(id)) && !this.isCriarGrupoSelecionado(group);
  }

  toggleCriarGrupo(group: PermissionGroup, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.getGroupPermissionIds(group).filter(id => !this.isCriarRolePermission(id));
    if (checked) {
      this.criarPermissionIds = [...new Set([...this.criarPermissionIds, ...ids])];
    } else {
      this.criarPermissionIds = this.criarPermissionIds.filter(id => !ids.includes(id));
    }
  }

  // â”€â”€ User helpers â”€â”€

  getUserRoleName(user: User): string {
    // 1. role é um objeto com nome (vem direto da API)
    if (user.role && typeof user.role === 'object' && !Array.isArray(user.role)) {
      return (user.role as Role).nome ?? 'Sem role';
    }
    // 2. roleId → busca na lista carregada
    if (user.roleId) {
      const found = this.roles.find(r => r.id === user.roleId);
      if (found) return found.nome;
    }
    // 3. role é string com o nome
    if (typeof user.role === 'string' && user.role) return user.role;
    // 4. roleName direto
    if (user.roleName) return user.roleName;
    return 'Sem role';
  }

  getUserRoleId(user: User): string {
    if (user.role && typeof user.role === 'object' && !Array.isArray(user.role)) {
      return (user.role as Role).id ?? '';
    }
    if (user.roleId) return user.roleId;
    return this.roles.find(r => r.nome === user.role || r.nome === user.roleName)?.id ?? '';
  }

  getUserPermissionNames(user: User) {
    const permissions = user.permissions ?? [];
    return permissions.length > 0 ? permissions.map(p => p.nome).join(', ') : 'Sem permissoes';
  }

  toggleEditPermission(permissionId: string, event: Event) {
    if (this.isEditRolePermission(permissionId)) return;
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.editPermissionIds = [...new Set([...this.editPermissionIds, permissionId])];
    } else {
      this.editPermissionIds = this.editPermissionIds.filter(id => id !== permissionId);
    }
  }

  onEditRoleChange() {
    this.atualizarPermissoesDaRoleEdit();
    this.editPermissionIds = this.editPermissionIds.filter(id => !this.editRolePermissionIds.includes(id));
  }

  isEditPermissionSelected(permissionId: string) {
    return this.isEditRolePermission(permissionId) || this.editPermissionIds.includes(permissionId);
  }

  isEditRolePermission(permissionId: string) {
    return this.editRolePermissionIds.includes(permissionId);
  }

  // â”€â”€ Private helpers â”€â”€

  private atualizarPermissoesDaRoleEdit() {
    const role = this.roles.find(item => item.id === this.editRoleId);
    this.editRolePermissionIds = role?.permissions?.map(p => p.id) ?? [];
  }

  private aplicarPermissoesDaRoleCriar() {
    const role = this.roles.find(item => item.id === this.criarRoleId);
    this.criarRolePermissionIds = role?.permissions?.map(p => p.id) ?? [];
  }

  private getUserExtraPermissionIds(user: User) {
    const explicitExtras = user.permissionIds ?? [];
    if (explicitExtras.length > 0) {
      return explicitExtras.filter(id => !this.editRolePermissionIds.includes(id));
    }
    return (user.permissions?.map(p => p.id) ?? []).filter(id => !this.editRolePermissionIds.includes(id));
  }

  private getRoleDoUsuario(user: User) {
    const userPermissionIds = user.permissions?.map(p => p.id) ?? [];
    return this.roles
      .filter(role => role.permissions.length > 0)
      .map(role => ({
        role,
        matched: role.permissions.filter(p => userPermissionIds.includes(p.id)).length
      }))
      .filter(item => item.matched > 0)
      .sort((a, b) => b.matched - a.matched)[0]?.role;
  }

  private agruparPermissoes(permissions: Permission[]): PermissionGroup[] {
    const groups = new Map<string, PermissionGroup>();
    permissions.forEach(permission => {
      const { recurso, action } = this.lerPermissao(permission.nome);
      const group = groups.get(recurso) ?? { recurso, permissions: {}, extras: [] };
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
    const resourceParts = prefixAction ? parts.slice(1) : suffixAction ? parts.slice(0, -1) : parts;
    return {
      recurso: this.formatarRecurso(resourceParts.join('_') || nome),
      action
    };
  }

  private formatarRecurso(recurso: string) {
    return recurso.toLowerCase().split('_').filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private getGroupPermissionIds(group: PermissionGroup): string[] {
    return [
      ...Object.values(group.permissions),
      ...group.extras
    ].filter((p): p is Permission => !!p).map(p => p.id);
  }
}
