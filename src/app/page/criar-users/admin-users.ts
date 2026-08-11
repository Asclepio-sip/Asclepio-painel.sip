import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Role, User, UserAdminService } from '../../service/UserAdmin.service';
import { UserLojaService } from '../../service/user-loja.service';
import { UserLoja } from '../../models/user-loja.model';
import { AuthService } from '../../service/auth.service';
import { Loja, LojaService } from '../../service/loja/loja.service';
import { forkJoin } from 'rxjs';

interface LinhaLojaCargo {
  lojaId: number | null;
  roleId: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {

  lojaId: number | null = null;

  usuarios: User[] = [];
  roles: Role[] = [];
  adminCount = 0;

  loading = false;

  // Filtros, busca e paginação (server-side, via GET /user)
  searchTerm = '';
  sortBy: 'recente' | 'nome' = 'recente';
  filterRole = '';
  showFiltros = false;
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  private buscaTimeout: any;

  // Gerenciar acessos (lojas/cargos) de um usuário
  gerenciarUsuario: User | null = null;
  lojasDoUsuario: UserLoja[] = [];
  carregandoLojasUsuario = false;
  editandoVinculoId: string | null = null;
  editRoleId = '';
  novoVinculoRoleId = '';
  salvandoVinculo = false;

  // Adicionar membro
  showCriarModal = false;
  modoCriar: 'existente' | 'novo' = 'existente';
  criarRoleId = '';
  salvandoCriar = false;

  buscaUsuarioTermo = '';
  resultadosBusca: User[] = [];
  buscandoUsuarios = false;
  usuarioSelecionado: User | null = null;
  private buscaUsuarioTimeout: any;

  novoNome = '';
  novoEmail = '';
  novoPassword = '';

  // Novo usuário: uma loja só, ou várias (com cargo por loja)
  todasLojas: Loja[] = [];
  modoLojas: 'unica' | 'multiplas' = 'unica';
  novoUsuarioLojas: LinhaLojaCargo[] = [];

  private readonly avatarColors = ['#dc2626', '#059669', '#7c3aed', '#d97706', '#2563eb', '#db2777', '#0891b2'];

  constructor(
    private userService: UserAdminService,
    private userLojaService: UserLojaService,
    private lojaService: LojaService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.lojaId = this.authService.getLojaId();
    this.carregarRoles();
    this.carregarUsuarios(0);
    this.carregarTodasLojas();
  }

  carregarTodasLojas() {
    this.lojaService.listar(0, 100).subscribe({
      next: response => {
        this.todasLojas = response.content;
        this.cd.detectChanges();
      },
      error: () => {}
    });
  }

  voltar() {
    this.router.navigate(['/loja']);
  }

  carregarUsuarios(page: number) {
    this.loading = true;

    this.userService.listarUsuarios(page, this.pageSize, {
      login: this.searchTerm.trim() || undefined,
      nomeRole: this.filterRole || undefined,
      sort: this.sortBy === 'nome' ? 'username,asc' : undefined
    }).subscribe({
      next: response => {
        this.usuarios = response.users;
        this.totalElements = response.totalElements;
        this.totalPages = Math.max(1, response.totalPages);
        this.currentPage = response.number + 1;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
        alert('Erro ao carregar usuários');
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

  // ── Filtros, busca e paginação ──

  filtrarUsuarios() {
    clearTimeout(this.buscaTimeout);
    this.buscaTimeout = setTimeout(() => {
      this.carregarUsuarios(0);
    }, 400);
  }

  toggleFiltros() {
    this.showFiltros = !this.showFiltros;
  }

  get paginatedUsers(): User[] {
    return this.usuarios;
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
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.carregarUsuarios(page - 1);
    }
  }

  // ── Avatar & badges ──

  getAvatarColor(user: User): string {
    const index = this.getNomeExibicao(user).charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getNomeExibicao(user: User): string {
    return user.nome || user.login;
  }

  getRoleBadgeClass(role: Role): string {
    const roleName = role.nome.toUpperCase();
    if (roleName.includes('SUPER')) return 'role-superadmin';
    if (roleName.includes('ADMIN')) return 'role-admin';
    if (roleName.includes('OPERADOR')) return 'role-operador';
    return 'role-default';
  }

  // ── Gerenciar acessos (lojas/cargos) ──

  abrirGerenciarAcessos(user: User) {
    this.gerenciarUsuario = user;
    this.lojasDoUsuario = [];
    this.editandoVinculoId = null;
    this.novoVinculoRoleId = this.roles[0]?.id || '';
    this.carregarLojasDoUsuario();
  }

  fecharGerenciarAcessos() {
    this.gerenciarUsuario = null;
  }

  carregarLojasDoUsuario() {
    if (!this.gerenciarUsuario) return;

    this.carregandoLojasUsuario = true;
    this.userLojaService.listarLojasDoUsuario(this.gerenciarUsuario.id).subscribe({
      next: lojas => {
        this.lojasDoUsuario = lojas;
        this.carregandoLojasUsuario = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.carregandoLojasUsuario = false;
        this.cd.detectChanges();
        alert('Erro ao carregar lojas do usuário');
      }
    });
  }

  editarVinculo(userLoja: UserLoja) {
    this.editandoVinculoId = userLoja.id;
    this.editRoleId = userLoja.role.id;
  }

  cancelarEdicaoVinculo() {
    this.editandoVinculoId = null;
  }

  salvarVinculo(userLoja: UserLoja) {
    if (!this.editRoleId) {
      alert('Selecione um cargo');
      return;
    }

    this.userLojaService.atualizarCargo(userLoja.id, this.editRoleId).subscribe({
      next: () => {
        this.editandoVinculoId = null;
        this.carregarLojasDoUsuario();
      },
      error: () => alert('Erro ao atualizar cargo')
    });
  }

  removerVinculo(userLoja: UserLoja) {
    if (!confirm(`Remover o acesso de ${userLoja.user.login} à loja ${userLoja.loja.nomeLoja}?`)) return;

    this.userLojaService.removerVinculo(userLoja.id).subscribe({
      next: () => {
        this.carregarLojasDoUsuario();
        this.carregarUsuarios(this.currentPage - 1);
      },
      error: () => alert('Erro ao remover acesso')
    });
  }

  adicionarNestaLoja() {
    if (!this.lojaId || !this.gerenciarUsuario) return;

    if (!this.novoVinculoRoleId) {
      alert('Selecione um cargo');
      return;
    }

    this.salvandoVinculo = true;
    this.userLojaService.criarVinculo({
      userId: this.gerenciarUsuario.id,
      lojaId: this.lojaId,
      roleId: this.novoVinculoRoleId
    }).subscribe({
      next: () => {
        this.salvandoVinculo = false;
        this.carregarLojasDoUsuario();
        this.carregarUsuarios(this.currentPage - 1);
      },
      error: () => {
        this.salvandoVinculo = false;
        this.cd.detectChanges();
        alert('Erro ao vincular usuário a esta loja');
      }
    });
  }

  jaTemAcessoNestaLoja(): boolean {
    return this.lojasDoUsuario.some(vinculo => vinculo.loja.id === this.lojaId);
  }

  // ── Adicionar membro (novo usuário ou usuário existente) ──

  abrirModalCriar() {
    this.showCriarModal = true;
    this.modoCriar = 'existente';
    this.criarRoleId = this.roles[0]?.id || '';
    this.buscaUsuarioTermo = '';
    this.resultadosBusca = [];
    this.usuarioSelecionado = null;
    this.novoNome = '';
    this.novoEmail = '';
    this.novoPassword = '';
    this.modoLojas = 'unica';
    this.novoUsuarioLojas = [];
    this.carregarUsuariosParaSelecao('');
  }

  selecionarModoCriar(modo: 'existente' | 'novo') {
    this.modoCriar = modo;

    if (modo === 'existente' && !this.usuarioSelecionado && this.resultadosBusca.length === 0) {
      this.carregarUsuariosParaSelecao('');
    }
  }

  // ── Novo usuário vinculado a várias lojas ──

  adicionarLinhaLoja() {
    this.novoUsuarioLojas = [
      ...this.novoUsuarioLojas,
      { lojaId: null, roleId: this.roles[0]?.id || '' }
    ];
  }

  removerLinhaLoja(index: number) {
    this.novoUsuarioLojas = this.novoUsuarioLojas.filter((_, i) => i !== index);
  }

  lojasDisponiveisParaLinha(index: number): Loja[] {
    const escolhidasEmOutrasLinhas = this.novoUsuarioLojas
      .filter((_, i) => i !== index)
      .map(linha => linha.lojaId);

    return this.todasLojas.filter(loja => !escolhidasEmOutrasLinhas.includes(loja.id ?? null));
  }

  fecharModalCriar() {
    this.showCriarModal = false;
  }

  buscarUsuarios() {
    clearTimeout(this.buscaUsuarioTimeout);
    this.buscaUsuarioTimeout = setTimeout(() => {
      this.carregarUsuariosParaSelecao(this.buscaUsuarioTermo.trim());
    }, 400);
  }

  private carregarUsuariosParaSelecao(termo: string) {
    this.buscandoUsuarios = true;
    this.userService.listarUsuarios(0, 30, { login: termo || undefined }).subscribe({
      next: response => {
        this.resultadosBusca = response.users;
        this.buscandoUsuarios = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.buscandoUsuarios = false;
        this.cd.detectChanges();
      }
    });
  }

  selecionarUsuarioExistente(user: User) {
    this.usuarioSelecionado = user;
    this.resultadosBusca = [];
    this.buscaUsuarioTermo = '';
  }

  trocarUsuarioExistente() {
    this.usuarioSelecionado = null;
    this.buscaUsuarioTermo = '';
    this.buscarUsuarios();
  }

  criarUsuario() {
    if (this.modoCriar === 'existente') {
      if (!this.lojaId) {
        alert('Nenhuma loja ativa nesta sessão');
        return;
      }

      if (!this.criarRoleId) {
        alert('Selecione um cargo');
        return;
      }

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

    if (!this.novoNome || !this.novoEmail || !this.novoPassword) {
      alert('Preencha nome, email e senha');
      return;
    }

    const lojas = this.montarLojasParaNovoUsuario();
    if (!lojas) return;

    this.salvandoCriar = true;
    this.userService.criarUsuario({
      nome: this.novoNome,
      email: this.novoEmail,
      password: this.novoPassword,
      lojas
    }).subscribe({
      next: res => this.finalizarCriacao(res.username),
      error: err => this.falharCriacao(err)
    });
  }

  private montarLojasParaNovoUsuario(): { lojaId: number; roleId: string }[] | null {
    if (this.modoLojas === 'unica') {
      if (!this.lojaId) {
        alert('Nenhuma loja ativa nesta sessão');
        return null;
      }

      if (!this.criarRoleId) {
        alert('Selecione um cargo');
        return null;
      }

      return [{ lojaId: this.lojaId, roleId: this.criarRoleId }];
    }

    if (this.novoUsuarioLojas.length === 0) {
      alert('Adicione pelo menos uma loja');
      return null;
    }

    const incompleta = this.novoUsuarioLojas.some(linha => !linha.lojaId || !linha.roleId);
    if (incompleta) {
      alert('Escolha a loja e o cargo em todas as linhas');
      return null;
    }

    return this.novoUsuarioLojas.map(linha => ({
      lojaId: linha.lojaId!,
      roleId: linha.roleId
    }));
  }

  private finalizarCriacao(loginGerado?: string) {
    alert(loginGerado
      ? `Usuário criado com sucesso! Login gerado: ${loginGerado}`
      : 'Usuário adicionado à loja com sucesso!');
    this.showCriarModal = false;
    this.salvandoCriar = false;
    this.atualizarAdminCount();
    this.carregarUsuarios(0);
  }

  private falharCriacao(err: any) {
    this.salvandoCriar = false;
    this.cd.detectChanges();
    alert(err.error?.message || err.error || 'Erro ao adicionar usuário à loja');
  }
}
