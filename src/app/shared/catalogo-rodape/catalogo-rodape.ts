import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContatoRodape, DesignCatalogo, contatosRodape } from '../../models/catalogo-online.model';

/** Rodapé do catálogo público (descrição + contatos/redes). Também usado na prévia do painel. */
@Component({
  selector: 'app-catalogo-rodape',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-rodape.html',
  styleUrl: './catalogo-rodape.css',
})
export class CatalogoRodape {
  @Input({ required: true }) design!: DesignCatalogo;
  @Input() titulo = '';
  /** Na prévia do painel os links não devem navegar. */
  @Input() previa = false;

  get contatos(): ContatoRodape[] {
    return contatosRodape(this.design);
  }

  get vazio(): boolean {
    return !this.design.descricaoRodape?.trim() && this.contatos.length === 0;
  }

  onClick(event: MouseEvent) {
    if (this.previa) event.preventDefault();
  }
}
