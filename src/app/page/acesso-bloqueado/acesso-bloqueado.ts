import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Tela mostrada quando a empresa foi bloqueada pelo painel SaaS (mensalidade não paga).
 * Chega aqui pelo login (403 "Conta Bloqueada") ou pelo interceptor, se o bloqueio acontecer no meio do uso.
 */
@Component({
  selector: 'app-acesso-bloqueado',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './acesso-bloqueado.html',
  styleUrl: './acesso-bloqueado.css',
})
export class AcessoBloqueado {
  currentYear = new Date().getFullYear();
}
