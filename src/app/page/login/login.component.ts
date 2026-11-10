import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, LojaEscolha } from '../../service/auth.service';
import { LINK_WHATSAPP } from '../landing/landing-navegacao';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
   styleUrl: './login.css',
})
export class LoginComponent implements OnInit {

  login = '';
  password = '';
  currentYear = new Date().getFullYear();
  mostrarSenha = false;
  readonly linkWhatsapp = LINK_WHATSAPP;

  readonly destaques = [
    'PDV com baixa automática no estoque',
    'Catálogo online com link próprio',
    'Várias lojas num só painel',
  ];

  step: 'credenciais' | 'escolher-loja' = 'credenciais';
  lojasDisponiveis: LojaEscolha[] = [];
  entrando = false;
  private tempToken = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  /** Mensagem do backend (403 "Usuario Desativado") quando o gerente desativou este usuário. */
  private readonly mensagemDesativado =
    'Seu usuário está desativado. Fale com o responsável pela sua loja.';

  ngOnInit() {
    // Veio do authInterceptor: estava logado e foi desativado no meio da sessão.
    if (this.route.snapshot.queryParamMap.get('motivo') === 'desativado') {
      setTimeout(() => alert(this.mensagemDesativado));
    }
  }

  /** 403 "Usuario Desativado": mostra o motivo. Devolve true se tratou o erro. */
  private avisarUsuarioDesativado(err: any): boolean {
    if (err?.status === 403 && err.error?.error === 'Usuario Desativado') {
      alert(err.error?.message || this.mensagemDesativado);
      return true;
    }
    return false;
  }

  /**
   * Empresa bloqueada pelo painel SaaS (403 "Conta Bloqueada"): vai para a tela que explica o motivo.
   * Devolve true se redirecionou; aí não precisa mostrar outro erro.
   */
  private irParaAcessoBloqueado(err: any): boolean {
    if (err?.status === 403 && err.error?.error === 'Conta Bloqueada') {
      this.router.navigate(['/acesso-bloqueado']);
      return true;
    }
    return false;
  }

  entrar() {
    this.entrando = true;

    this.authService.login(this.login, this.password).subscribe({
      next: resultado => {
        this.entrando = false;

        if (resultado.requiresLojaSelection) {
          this.lojasDisponiveis = resultado.lojas;
          this.tempToken = resultado.tempToken;
          this.step = 'escolher-loja';
          this.cd.detectChanges();
          return;
        }

        this.router.navigate([this.authService.getHomeRoute()]);
      },
      error: err => {
        this.entrando = false;
        this.cd.detectChanges();
        if (!this.irParaAcessoBloqueado(err) && !this.avisarUsuarioDesativado(err)) {
          alert('Login ou senha inválidos');
        }
      }
    });
  }

  selecionarLoja(loja: LojaEscolha) {
    this.authService.escolherLoja(loja.id, this.tempToken).subscribe({
      next: () => this.router.navigate([this.authService.getHomeRoute()]),
      error: err => this.irParaAcessoBloqueado(err) || this.avisarUsuarioDesativado(err) || alert('Não foi possível entrar nessa loja. Tente novamente.')
    });
  }

  verTodasAsLojas() {
    this.authService.escolherLoja(null, this.tempToken).subscribe({
      next: () => this.router.navigate([this.authService.getHomeRoute()]),
      error: err => this.irParaAcessoBloqueado(err) || this.avisarUsuarioDesativado(err) || alert('Sua conta não tem permissão para ver todas as lojas de uma vez.')
    });
  }

  voltarParaCredenciais() {
    this.step = 'credenciais';
    this.lojasDisponiveis = [];
    this.tempToken = '';
  }
}
