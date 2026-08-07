import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LojaEscolha } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
   styleUrl: './login.css',
})
export class LoginComponent {

  login = '';
  password = '';
  currentYear = new Date().getFullYear();

  step: 'credenciais' | 'escolher-loja' = 'credenciais';
  lojasDisponiveis: LojaEscolha[] = [];
  entrando = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  entrar() {
    this.entrando = true;

    this.authService.login(this.login, this.password).subscribe({
      next: resultado => {
        this.entrando = false;

        if (resultado.requiresLojaSelection) {
          this.lojasDisponiveis = resultado.lojas;
          this.step = 'escolher-loja';
          return;
        }

        this.router.navigate([this.authService.getHomeRoute()]);
      },
      error: () => {
        this.entrando = false;
        alert('Login ou senha inválidos');
      }
    });
  }

  selecionarLoja(loja: LojaEscolha) {
    this.authService.escolherLoja(loja.id).subscribe({
      next: () => this.router.navigate([this.authService.getHomeRoute()]),
      error: () => alert('Não foi possível entrar nessa loja. Tente novamente.')
    });
  }

  voltarParaCredenciais() {
    this.step = 'credenciais';
    this.lojasDisponiveis = [];
  }
}
