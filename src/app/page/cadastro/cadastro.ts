import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
 
@Component({
  selector: 'app-cadastro',
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class CadastroComponent {
 
  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  erro = '';
  carregando = false;
  currentYear = new Date().getFullYear();
 
  constructor(
    private router: Router
  ) {}
 
  cadastrar() {
    this.erro = '';
 
    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return;
    }
 
    this.carregando = true;
 

  }
}