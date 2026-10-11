import { Component, ViewEncapsulation } from '@angular/core';
import { LandingHeader } from './secoes/landing-header/landing-header';
import { LandingHero } from './secoes/landing-hero/landing-hero';
import { LandingRecursos } from './secoes/landing-recursos/landing-recursos';
import { LandingComoFunciona } from './secoes/landing-como-funciona/landing-como-funciona';
import { LandingCatalogo } from './secoes/landing-catalogo/landing-catalogo';
import { LandingMultiLoja } from './secoes/landing-multi-loja/landing-multi-loja';
import { LandingPlanos } from './secoes/landing-planos/landing-planos';
import { LandingFaq } from './secoes/landing-faq/landing-faq';
import { LandingCta } from './secoes/landing-cta/landing-cta';
import { LandingFooter } from './secoes/landing-footer/landing-footer';
import { LandingWhatsapp } from './secoes/landing-whatsapp/landing-whatsapp';

/**
 * Landing page pública. Cada seção é um componente em ./secoes.
 * landing.css não é encapsulado: guarda as cores (variáveis --lp-*) e as classes
 * compartilhadas (.lp-btn, .lp-titulo...), todas debaixo de .lp.
 */
@Component({
  selector: 'app-landing',
  imports: [
    LandingHeader,
    LandingHero,
    LandingRecursos,
    LandingComoFunciona,
    LandingCatalogo,
    LandingMultiLoja,
    LandingPlanos,
    LandingFaq,
    LandingCta,
    LandingFooter,
    LandingWhatsapp,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  encapsulation: ViewEncapsulation.None,
})
export class LandingComponent {}
