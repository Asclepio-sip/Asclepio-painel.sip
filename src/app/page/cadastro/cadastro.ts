import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CadastroService } from '../../service/cadastro.service';
 
@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class CadastroComponent {
 
  login = '';
  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  erro = '';
  carregando = false;
  currentYear = new Date().getFullYear();
 
  constructor(
    private router: Router,
    private cadastroService: CadastroService
  ) {}
 
  cadastrar() {
    this.erro = '';
 
    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return;
    }
 
    this.carregando = true;

    this.cadastroService.criarConta({
      login: this.login.trim(),
      password: this.senha,
      email: this.email.trim(),
      nomeEmpresa: this.nome.trim()
    }).subscribe({
      next: (res) => {
        sessionStorage.setItem('token', res.token);
        this.router.navigate(['/products']);
      },
      error: () => {
        this.erro = 'Não foi possível criar a conta. Tente novamente.';
        this.carregando = false;
      }
    });

  }
}