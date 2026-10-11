import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LINK_WHATSAPP, ROTA_LOGIN, rolarParaSecao } from '../../landing-navegacao';

@Component({
  selector: 'app-landing-header',
  imports: [RouterLink],
  templateUrl: './landing-header.html',
  styleUrl: './landing-header.css',
})
export class LandingHeader {
  readonly rotaLogin = ROTA_LOGIN;
  readonly linkCriarConta = LINK_WHATSAPP;
  readonly ir = rolarParaSecao;

  readonly links = [
    { id: 'recursos', texto: 'Recursos' },
    { id: 'como-funciona', texto: 'Como funciona' },
    { id: 'catalogo', texto: 'Catálogo' },
    { id: 'planos', texto: 'Planos' },
    { id: 'faq', texto: 'Dúvidas' },
  ];
}
