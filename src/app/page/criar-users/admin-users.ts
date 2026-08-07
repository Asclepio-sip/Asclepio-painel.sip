import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Permission, Role, User, UserAdminService } from '../../service/UserAdmin.service';
import { UserLojaService } from '../../service/user-loja.service';
import { UserLoja } from '../../models/user-loja.model';
import { AuthService } from '../../service/auth.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {

  lojaId: number | null = null;

  membros: UserLoja[] = [];
  roles: Role[] = [];
  permissions: Permission[] = [];

  loading = false;

  // Filtros, busca e paginação (tudo em memória, sobre `membros`)
  searchTerm = '';
  sortBy: 'recente' | 'nome' | 'role' = 'recente';
  filterRole = '';
  showFiltros = false;
  currentPage = 1;
  pageSize = 10;

  // Editar cargo
  editUserLoja: UserLoja | null = null;
  editRoleId = '';

  // Adicionar membro
  showCriarModal = false;
  modoCriar: 'existente' | 'novo' = 'existente';
  criarRoleId = '';
  salvandoCriar = false;

  buscaUsuarioTermo = '';
  resultadosBusca: User[] = [];
  buscandoUsuarios = false;
  usuarioSelecionado: User | null = null;
  private buscaTimeout: any;

  novoLogin = '';
  novoEmail = '';
  novoPassword = '';

  private readonly avatarColors = ['#dc2626', '#059669', '#7c3aed', '#d97706', '#2563eb', '#db2777', '#0891b2'];

  constructor(
    private userService: UserAdminService,
    private userLojaService: UserLojaService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.lojaId = this.authService.getLojaId();
    this.carregarRoles();
    this.carregarPermissoes();
    this.carregarMembros();
  }

  voltar() {
    this.router.navigate(['/loja']);
  }

  carregarMembros() {
    if (!this.lojaId) {
      this.membros = [];
      return;
    }

    this.loading = true;

    this.userLojaService.listarPorLoja(this.lojaId).subscribe({
      next: membros => {
        this.membros = membros;
        this.currentPage = 1;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        alert('Erro ao carregar usuários da loja');
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

  // ── Filtros, busca e paginação (em memória) ──

  get membrosFiltrados(): UserLoja[] {
    let lista = this.membros;

    const termo = this.searchTerm.trim().toLowerCase();
    if (termo) {
      lista = lista.filter(m =>
        m.user.login.toLowerCase().includes(termo) ||
        (m.user.email ?? '').toLowerCase().includes(termo)
      );
    }

    if (this.filterRole) {
      lista = lista.filter(m => m.role.nome === this.filterRole);
    }

    if (this.sortBy === 'nome') {
      lista = [...lista].sort((a, b) => a.user.login.localeCompare(b.user.login));
    } else if (this.sortBy === 'role') {
      lista = [...lista].sort((a, b) => a.role.nome.localeCompare(b.role.nome));
    }

    return lista;
  }

  get totalElements(): number {
    return this.membrosFiltrados.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }

  get paginatedUsers(): UserLoja[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.membrosFiltrados.slice(start, start + this.pageSize);
  }

  get adminCount(): number {
    return this.membros.filter(m => /ADMIN|SUPER/i.test(m.role.nome)).length;
  }

  filtrarUsuarios() {
    this.currentPage = 1;
  }

  toggleFiltros() {
    this.showFiltros = !this.showFiltros;
  }

  getPageStart(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalElements);
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ── Avatar & badges ──

  getAvatarColor(userLoja: UserLoja): string {
    const index = userLoja.user.login.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getRoleBadgeClass(userLoja: UserLoja): string {
    const roleName = userLoja.role.nome.toUpperCase();
    if (roleName.includes('SUPER')) return 'role-superadmin';
    if (roleName.includes('ADMIN')) return 'role-admin';
    if (roleName.includes('OPERADOR')) return 'role-operador';
    return 'role-default';
  }

  getRolePermissionCount(role: Role): number {
    return role.permissions?.length ?? 0;
  }

  getRolePermissionPercent(role: Role): number {
    if (!this.permissions.length) return 0;
    return (this.getRolePermissionCount(role) / this.permissions.length) * 100;
  }

  getPermissionBarColor(role: Role): string {
    const percent = this.getRolePermissionPercent(role);
    if (percent >= 80) return '#059669';
    if (percent >= 40) return '#d97706';
    return '#dc2626';
  }

  // ── Ajustar cargo ──

  editar(userLoja: UserLoja) {
    this.editUserLoja = userLoja;
    this.editRoleId = userLoja.role.id;
  }

  cancelar() {
    this.editUserLoja = null;
  }

  salvar() {
    if (!this.editUserLoja) return;

    if (!this.editRoleId) {
      alert('Selecione um cargo');
      return;
    }

    this.userLojaService.atualizarCargo(this.editUserLoja.id, this.editRoleId).subscribe({
      next: () => {
        alert('Cargo atualizado!');
        this.editUserLoja = null;
        this.carregarMembros();
      },
      error: () => alert('Erro ao atualizar cargo')
    });
  }

  remover(userLoja: UserLoja) {
    if (!confirm(`Remover o acesso de ${userLoja.user.login} a esta loja?`)) return;

    this.userLojaService.removerVinculo(userLoja.id).subscribe({
      next: () => this.carregarMembros(),
      error: () => alert('Erro ao remover acesso')
    });
  }

  getRoleNome(role: Role | undefined): string {
    return role?.nome ?? 'Sem role';
  }

  getRoleById(roleId: string): Role | undefined {
    return this.roles.find(r => r.id === roleId);
  }

  // ── Adicionar membro ──

  abrirModalCriar() {
    this.showCriarModal = true;
    this.modoCriar = 'existente';
    this.criarRoleId = this.roles[0]?.id || '';
    this.buscaUsuarioTermo = '';
    this.resultadosBusca = [];
    this.usuarioSelecionado = null;
    this.novoLogin = '';
    this.novoEmail = '';
    this.novoPassword = '';
  }

  fecharModalCriar() {
    this.showCriarModal = false;
  }

  buscarUsuarios() {
    clearTimeout(this.buscaTimeout);

    const termo = this.buscaUsuarioTermo.trim();
    if (!termo) {
      this.resultadosBusca = [];
      return;
    }

    this.buscaTimeout = setTimeout(() => {
      this.buscandoUsuarios = true;
      this.userService.listarUsuarios(0, 10, { login: termo }).subscribe({
        next: response => {
          this.resultadosBusca = response.users;
          this.buscandoUsuarios = false;
          this.cd.detectChanges();
        },
        error: () => {
          this.buscandoUsuarios = false;
        }
      });
    }, 400);
  }

  selecionarUsuarioExistente(user: User) {
    this.usuarioSelecionado = user;
    this.resultadosBusca = [];
    this.buscaUsuarioTermo = user.login;
  }

  criarUsuario() {
    if (!this.lojaId) {
      alert('Nenhuma loja ativa nesta sessão');
      return;
    }

    if (!this.criarRoleId) {
      alert('Selecione um cargo');
      return;
    }

    if (this.modoCriar === 'existente') {
      if (!this.usuarioSelecionado) {
        alert('Busque e selecione um usuário existente');
        return;
      }

      this.salvandoCriar = true;
      this.userLojaService.criarVinculo({
        userId: this.usuarioSelecionado.id,
        lojaId: this.lojaId,
        roleId: this.criarRoleId
      }).subscribe({
        next: () => this.finalizarCriacao(),
        error: err => this.falharCriacao(err)
      });
      return;
    }

    if (!this.novoLogin || !this.novoEmail || !this.novoPassword) {
      alert('Preencha login, email e senha');
      return;
    }

    this.salvandoCriar = true;
    this.userService.criarUsuario({
      login: this.novoLogin,
      Email: this.novoEmail,
      password: this.novoPassword
    }).pipe(
      switchMap(usuarioCriado => this.userLojaService.criarVinculo({
        userId: usuarioCriado.id,
        lojaId: this.lojaId!,
        roleId: this.criarRoleId
      }))
    ).subscribe({
      next: () => this.finalizarCriacao(),
      error: err => this.falharCriacao(err)
    });
  }

  private finalizarCriacao() {
    alert('Usuário adicionado à loja com sucesso!');
    this.showCriarModal = false;
    this.salvandoCriar = false;
    this.carregarMembros();
  }

  private falharCriacao(err: any) {
    this.salvandoCriar = false;
    alert(err.error || 'Erro ao adicionar usuário à loja');
  }
}
