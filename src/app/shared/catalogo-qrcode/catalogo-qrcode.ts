import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

/**
 * QR code do link público do catálogo. Gerado no navegador a partir do link
 * (não passa pelo backend). Permite baixar em PNG (alta resolução) ou SVG.
 */
@Component({
  selector: 'app-catalogo-qrcode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-qrcode.html',
  styleUrl: './catalogo-qrcode.css',
})
export class CatalogoQrcode implements OnChanges {
  @Input({ required: true }) link!: string;
  /** Usado no nome do arquivo baixado (normalmente o nomeLink). */
  @Input() nomeArquivo = 'catalogo';

  /** Tamanho do PNG baixado — grande o bastante para impressão (cartaz, adesivo). */
  private readonly tamanhoDownload = 1024;
  /** Nível H aguenta ~30% do código danificado/coberto (bom para impressão). */
  private readonly opcoes = { errorCorrectionLevel: 'H' as const, margin: 2 };

  imagem = '';
  erro = false;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnChanges() {
    this.gerar();
  }

  private async gerar() {
    this.erro = false;
    if (!this.link) {
      this.imagem = '';
      return;
    }
    try {
      this.imagem = await QRCode.toDataURL(this.link, { ...this.opcoes, width: this.tamanhoDownload });
    } catch {
      this.imagem = '';
      this.erro = true;
    }
    this.cd.detectChanges();
  }

  baixarPng() {
    if (!this.imagem) return;
    this.baixar(this.imagem, `qrcode-${this.nomeArquivo}.png`);
  }

  async baixarSvg() {
    if (!this.link) return;
    try {
      const svg = await QRCode.toString(this.link, { ...this.opcoes, type: 'svg' });
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      this.baixar(url, `qrcode-${this.nomeArquivo}.svg`);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      alert('Não foi possível gerar o QR code em SVG.');
    }
  }

  private baixar(href: string, nome: string) {
    const a = document.createElement('a');
    a.href = href;
    a.download = nome;
    a.click();
  }
}
