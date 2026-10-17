import { Component, Input, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LojaService } from '../../../service/loja/loja.service';

/**
 * Cabeçalho comum das telas de configuração de uma loja
 * (editar dados, formas de pagamento e frete por bairro): título + abas.
 */
@Component({
  selector: 'app-loja-cabecalho',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './loja-cabecalho.html',
  styleUrl: './loja-cabecalho.css',
})
export class LojaCabecalho implements OnInit {
  @Input({ required: true }) lojaId!: number;
  @Input({ required: true }) titulo!: string;
  @Input() subtitulo = '';

  /**
   * Mostra a aba "Frete por bairro" (só faz sentido em loja com entrega).
   * Se a tela não informar, o cabeçalho consulta o tipo de atendimento da loja.
   */
  @Input() mostrarFrete: boolean | null = null;

  /** Começa true: se a consulta falhar, a aba continua visível. */
  private freteDaLoja = signal(true);

  constructor(private lojaService: LojaService) {}

  ngOnInit() {
    if (this.mostrarFrete !== null || !this.lojaId) return;

    this.lojaService.buscarPorId(this.lojaId).subscribe({
      next: loja => this.freteDaLoja.set(loja.tipoAtendimento !== 'RETIRADA'),
      error: () => {}
    });
  }

  get exibirFrete(): boolean {
    return this.mostrarFrete ?? this.freteDaLoja();
  }
}
