import { Component } from '@angular/core';
import { LINK_WHATSAPP, rolarParaSecao } from '../../landing-navegacao';

@Component({
  selector: 'app-landing-cta',
  templateUrl: './landing-cta.html',
  styleUrl: './landing-cta.css',
})
export class LandingCta {
  readonly linkCriarConta = LINK_WHATSAPP;
  readonly ir = rolarParaSecao;
}
