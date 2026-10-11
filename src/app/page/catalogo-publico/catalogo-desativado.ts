import { Component, Input } from '@angular/core';

/**
 * Aviso para quem abre o catálogo de uma farmácia bloqueada pelo painel SaaS (mensalidade não paga).
 * Não fala em pagamento: quem vê é o cliente final da farmácia.
 */
@Component({
  selector: 'app-catalogo-desativado',
  standalone: true,
  template: `
    <section class="desativado" aria-labelledby="titulo-desativado">
      <div class="icone">
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="selo-linha"><span class="selo">Pausado</span></div>
      <h1 id="titulo-desativado">Catálogo desativado temporariamente</h1>
      <p>
        @if (nomeLoja) {
          O catálogo de <strong>{{ nomeLoja }}</strong> está fora do ar no momento.
        } @else {
          Este catálogo está fora do ar no momento.
        }
        Volte daqui a pouco para fazer o seu pedido.
      </p>
      <div class="dica">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>
        <span>Precisa de algo agora? Fale direto com a farmácia.</span>
      </div>
      <button type="button" class="btn" (click)="recarregar()">Tentar novamente</button>
    </section>
  `,
  styles: [`
    .desativado { max-width: 460px; margin: 48px auto; text-align: center; background: #fff; border-radius: 18px; padding: 40px 28px 32px; box-shadow: 0 8px 30px rgba(15,23,42,.08); }
    .icone { width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 50%; background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 8px #fffbeb80; }
    .selo-linha { display: flex; justify-content: center; margin-bottom: 10px; }
    .selo { padding: 3px 12px; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; }
    h1 { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    p { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 18px; }
    p strong { color: #374151; }
    .dica { display: flex; align-items: center; gap: 10px; text-align: left; background: #f9fafb; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #4b5563; margin-bottom: 22px; }
    .dica svg { flex: 0 0 auto; color: #9ca3af; }
    .btn { padding: 11px 24px; border: 1.5px solid #e5e7eb; border-radius: 9px; background: #fff; color: #374151; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .2s; }
    .btn:hover { border-color: #d97706; color: #d97706; }
    @media (max-width: 480px) { .desativado { margin: 24px 4px; padding: 32px 20px 26px; } }
  `],
})
export class CatalogoDesativado {
  @Input() nomeLoja: string | null = null;

  recarregar(): void {
    window.location.reload();
  }
}
