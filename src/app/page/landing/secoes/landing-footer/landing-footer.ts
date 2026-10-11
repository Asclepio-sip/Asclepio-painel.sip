import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LINK_WHATSAPP, ROTA_LOGIN, rolarParaSecao } from '../../landing-navegacao';

@Component({
  selector: 'app-landing-footer',
  imports: [RouterLink],
  templateUrl: './landing-footer.html',
  styleUrl: './landing-footer.css',
})
export class LandingFooter {
  readonly rotaLogin = ROTA_LOGIN;
  readonly linkCriarConta = LINK_WHATSAPP;
  readonly ir = rolarParaSecao;
  readonly anoAtual = new Date().getFullYear();
}
