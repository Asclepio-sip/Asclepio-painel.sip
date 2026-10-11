import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LojaEscolha } from '../../service/auth.service';
import { LINK_WHATSAPP } from '../landing/landing-navegacao';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
   styleUrl: './login.css',
})
export class LoginComponent {

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
    private cd: ChangeDetectorRef
  ) {}

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
        if (!this.irParaAcessoBloqueado(err)) {
          alert('Login ou senha inválidos');
        }
      }
    });
  }

  selecionarLoja(loja: LojaEscolha) {
    this.authService.escolherLoja(loja.id, this.tempToken).subscribe({
      next: () => this.router.navigate([this.authService.getHomeRoute()]),
      error: err => this.irParaAcessoBloqueado(err) || alert('Não foi possível entrar nessa loja. Tente novamente.')
    });
  }

  verTodasAsLojas() {
    this.authService.escolherLoja(null, this.tempToken).subscribe({
      next: () => this.router.navigate([this.authService.getHomeRoute()]),
      error: err => this.irParaAcessoBloqueado(err) || alert('Sua conta não tem permissão para ver todas as lojas de uma vez.')
    });
  }

  voltarParaCredenciais() {
    this.step = 'credenciais';
    this.lojasDisponiveis = [];
    this.tempToken = '';
  }
}
