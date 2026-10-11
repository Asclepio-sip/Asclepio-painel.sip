import { Component } from '@angular/core';
import { LINK_WHATSAPP } from '../../landing-navegacao';

/** Botão flutuante que abre a conversa no WhatsApp com a mensagem já escrita. */
@Component({
  selector: 'app-landing-whatsapp',
  templateUrl: './landing-whatsapp.html',
  styleUrl: './landing-whatsapp.css',
})
export class LandingWhatsapp {
  readonly link = LINK_WHATSAPP;
}
