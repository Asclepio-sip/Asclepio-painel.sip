import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Role, User, UserAdminService } from '../../service/UserAdmin.service';
import { UserLojaService } from '../../service/user-loja.service';
import { AuthService } from '../../service/auth.service';
import { Loja, LojaService } from '../../service/loja/loja.service';
import { forkJoin } from 'rxjs';

interface LinhaLojaCargo {
  lojaId: number | null;
  roleId: string;
}

interface DropdownAcesso {
  index: number;
  campo: 'loja' | 'cargo';
  top: number | null;
  bottom: number | null;
  left: number;
  width: number;
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

  // Gerenciar acessos (lojas/cargos) de um usuário — salvo tudo de uma vez via PUT /user/{id}/lojas
  gerenciarUsuario: User | null = null;
  acessosLinhas: LinhaLojaCargo[] = [];
  carregandoLojasUsuario = false;
  falhaCarregarLojasUsuario = false;
  salvandoAcessos = false;

  // Dropdown customizado de loja/cargo (o <select> nativo não aceita estilo na lista)
  dropdown: DropdownAcesso | null = null;
  buscaDropdown = '';

  // Adicionar membro (sempre um novo usuário)
  showCriarModal = false;
  criarRoleId = '';
  salvandoCriar = false;

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
    this.acessosLinhas = [];
    this.falhaCarregarLojasUsuario = false;
    this.carregarLojasDoUsuario();
  }

  fecharGerenciarAcessos() {
    this.fecharDropdown();
    this.gerenciarUsuario = null;
  }

  carregarLojasDoUsuario() {
    if (!this.gerenciarUsuario) return;

    this.carregandoLojasUsuario = true;
    this.falhaCarregarLojasUsuario = false;
    this.userLojaService.listarLojasDoUsuario(this.gerenciarUsuario.id).subscribe({
      next: lojas => {
        this.acessosLinhas = lojas.map(vinculo => ({
          lojaId: vinculo.lojaId,
          roleId: vinculo.roleId
        }));
        this.carregandoLojasUsuario = false;
        this.cd.detectChanges();
      },
      error: () => {
        // Sem os vínculos atuais não dá pra salvar: o PUT substitui tudo e apagaria os acessos.
        this.falhaCarregarLojasUsuario = true;
        this.carregandoLojasUsuario = false;
        this.cd.detectChanges();
      }
    });
  }

  adicionarLinhaAcesso() {
    this.acessosLinhas = [
      ...this.acessosLinhas,
      { lojaId: null, roleId: this.roles[0]?.id || '' }
    ];
  }

  removerLinhaAcesso(index: number) {
    this.fecharDropdown();
    this.acessosLinhas = this.acessosLinhas.filter((_, i) => i !== index);
  }

  abrirDropdown(event: MouseEvent, index: number, campo: 'loja' | 'cargo') {
    event.stopPropagation();

    if (this.isDropdownAberto(index, campo)) {
      this.fecharDropdown();
      return;
    }

    // Painel com position: fixed pra não ser cortado pelo scroll do modal;
    // abre pra cima quando não cabe embaixo.
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const alturaPainel = 300;
    const abrirPraCima = window.innerHeight - rect.bottom < alturaPainel && rect.top > alturaPainel;

    this.buscaDropdown = '';
    this.dropdown = {
      index,
      campo,
      top: abrirPraCima ? null : rect.bottom + 6,
      bottom: abrirPraCima ? window.innerHeight - rect.top + 6 : null,
      left: rect.left,
      width: Math.max(rect.width, 240)
    };
  }

  isDropdownAberto(index: number, campo: 'loja' | 'cargo'): boolean {
    return this.dropdown?.index === index && this.dropdown?.campo === campo;
  }

  @HostListener('window:resize')
  @HostListener('document:keydown.escape')
  fecharDropdown() {
    this.dropdown = null;
  }

  opcoesLojaDropdown(): Loja[] {
    if (!this.dropdown) return [];

    const termo = this.buscaDropdown.trim().toLowerCase();
    return this.lojasDisponiveisParaAcesso(this.dropdown.index)
      .filter(loja => !termo || loja.nomeLoja.toLowerCase().includes(termo));
  }

  opcoesCargoDropdown(): Role[] {
    const termo = this.buscaDropdown.trim().toLowerCase();
    return this.roles.filter(role => !termo || role.nome.toLowerCase().includes(termo));
  }

  selecionarNoDropdown(valor: number | string) {
    if (!this.dropdown) return;

    const linha = this.acessosLinhas[this.dropdown.index];
    if (this.dropdown.campo === 'loja') {
      linha.lojaId = valor as number;
    } else {
      linha.roleId = valor as string;
    }

    this.fecharDropdown();
  }

  nomeLoja(lojaId: number | null): string {
    return this.todasLojas.find(loja => loja.id === lojaId)?.nomeLoja ?? '';
  }

  cargoPorId(roleId: string): Role | undefined {
    return this.roles.find(role => role.id === roleId);
  }

  lojasDisponiveisParaAcesso(index: number): Loja[] {
    return this.lojasDisponiveis(this.acessosLinhas, index);
  }

  salvarAcessos() {
    if (!this.gerenciarUsuario || this.falhaCarregarLojasUsuario) return;

    const lojas = this.validarLinhas(this.acessosLinhas);
    if (!lojas) return;

    this.salvandoAcessos = true;
    this.userLojaService.atualizarLojasDoUsuario(this.gerenciarUsuario.id, lojas).subscribe({
      next: () => {
        this.salvandoAcessos = false;
        this.gerenciarUsuario = null;
        alert('Acessos atualizados com sucesso!');
        this.atualizarAdminCount();
        this.carregarUsuarios(this.currentPage - 1);
      },
      error: err => {
        this.salvandoAcessos = false;
        this.cd.detectChanges();
        alert(err.error?.message || 'Erro ao atualizar acessos do usuário');
      }
    });
  }

  // ── Adicionar membro (novo usuário) ──

  abrirModalCriar() {
    this.showCriarModal = true;
    this.criarRoleId = this.roles[0]?.id || '';
    this.novoNome = '';
    this.novoEmail = '';
    this.novoPassword = '';
    this.modoLojas = 'unica';
    this.novoUsuarioLojas = [];
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
    return this.lojasDisponiveis(this.novoUsuarioLojas, index);
  }

  private lojasDisponiveis(linhas: LinhaLojaCargo[], index: number): Loja[] {
    const escolhidasEmOutrasLinhas = linhas
      .filter((_, i) => i !== index)
      .map(linha => linha.lojaId);

    return this.todasLojas.filter(loja => !escolhidasEmOutrasLinhas.includes(loja.id ?? null));
  }

  fecharModalCriar() {
    this.showCriarModal = false;
  }

  criarUsuario() {
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

    return this.validarLinhas(this.novoUsuarioLojas);
  }

  private validarLinhas(linhas: LinhaLojaCargo[]): { lojaId: number; roleId: string }[] | null {
    if (linhas.length === 0) {
      alert('Adicione pelo menos uma loja');
      return null;
    }

    const incompleta = linhas.some(linha => !linha.lojaId || !linha.roleId);
    if (incompleta) {
      alert('Escolha a loja e o cargo em todas as linhas');
      return null;
    }

    return linhas.map(linha => ({
      lojaId: linha.lojaId!,
      roleId: linha.roleId
    }));
  }

  private finalizarCriacao(loginGerado: string) {
    alert(`Usuário criado com sucesso! Login gerado: ${loginGerado}`);
    this.showCriarModal = false;
    this.salvandoCriar = false;
    this.atualizarAdminCount();
    this.carregarUsuarios(0);
  }

  private falharCriacao(err: any) {
    this.salvandoCriar = false;
    this.cd.detectChanges();
    alert(err.error?.message || err.error || 'Erro ao criar usuário');
  }
}
