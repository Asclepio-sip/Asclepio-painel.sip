import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoOnlineService } from '../../service/catalogo-online.service';
import { IMAGEM_TAMANHO_MAXIMO, ImagemCatalogo, TipoImagemCatalogo } from '../../models/catalogo-online.model';

/**
 * Card de upload de imagem do catálogo (banner ou logo): escolher/arrastar, enviar
 * (POST 1ª vez, PUT para trocar) e liga/desliga (PATCH /status), tudo independente
 * do "Salvar design".
 */
@Component({
  selector: 'app-catalogo-imagem-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-imagem-upload.html',
  styleUrl: './catalogo-imagem-upload.css',
})
export class CatalogoImagemUpload implements OnInit, OnDestroy {
  @Input({ required: true }) tipo!: TipoImagemCatalogo;
  @Input({ required: true }) titulo!: string;
  @Input() subtitulo = '';
  @Input() formato: 'largo' | 'quadrado' = 'largo';
  @Input() podeEditar = false;
  /** Imagem que a prévia deve mostrar: a escolhida (ainda não enviada) ou a salva, se ativa. */
  @Output() previaChange = new EventEmitter<string | null>();

  imagem: ImagemCatalogo = { url: null, ativo: false };
  arquivo: File | null = null;
  previewLocal: string | null = null;
  enviando = false;
  alterandoStatus = false;
  arrastando = false;
  erro = '';

  constructor(
    private catalogoOnlineService: CatalogoOnlineService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.catalogoOnlineService.getImagem(this.tipo).subscribe({
      next: imagem => {
        this.imagem = imagem;
        this.emitirPrevia();
        this.cd.detectChanges();
      },
      error: () => {}
    });
  }

  ngOnDestroy() {
    this.liberarPreviewLocal();
  }

  get nome(): string {
    return this.tipo === 'logo' ? 'logo' : 'banner';
  }

  onSelecionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.escolher(input.files?.[0] ?? null);
    input.value = ''; // permite escolher o mesmo arquivo de novo
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.arrastando = false;
    if (this.podeEditar) this.escolher(event.dataTransfer?.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (this.podeEditar) this.arrastando = true;
  }

  private escolher(arquivo: File | null) {
    this.erro = '';
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.erro = 'Escolha um arquivo de imagem (JPG, PNG ou WEBP).';
      return;
    }
    if (arquivo.size > IMAGEM_TAMANHO_MAXIMO) {
      this.erro = 'A imagem tem mais de 15 MB. Escolha uma menor.';
      return;
    }

    this.liberarPreviewLocal();
    this.arquivo = arquivo;
    this.previewLocal = URL.createObjectURL(arquivo);
    this.emitirPrevia();
  }

  cancelar() {
    this.liberarPreviewLocal();
    this.arquivo = null;
    this.erro = '';
    this.emitirPrevia();
  }

  enviar() {
    if (!this.arquivo) return;

    this.enviando = true;
    this.erro = '';
    this.catalogoOnlineService.enviarImagem(this.tipo, this.arquivo, !!this.imagem.url).subscribe({
      next: imagem => {
        this.imagem = imagem;
        this.arquivo = null;
        this.liberarPreviewLocal();
        this.enviando = false;
        this.emitirPrevia();
        this.cd.detectChanges();
      },
      error: err => {
        this.enviando = false;
        this.erro = err.error?.message || `Não foi possível enviar o ${this.nome}. Tente novamente.`;
        this.cd.detectChanges();
      }
    });
  }

  /** Troca otimista, volta se o PATCH falhar. */
  alternarAtivo() {
    if (!this.imagem.url || this.alterandoStatus) return;

    const anterior = this.imagem.ativo;
    this.imagem = { ...this.imagem, ativo: !anterior };
    this.alterandoStatus = true;
    this.erro = '';
    this.emitirPrevia();

    this.catalogoOnlineService.setImagemAtiva(this.tipo, !anterior).subscribe({
      next: imagem => {
        this.imagem = imagem;
        this.alterandoStatus = false;
        this.emitirPrevia();
        this.cd.detectChanges();
      },
      error: err => {
        this.imagem = { ...this.imagem, ativo: anterior };
        this.alterandoStatus = false;
        this.erro = err.error?.message || `Não foi possível alterar o ${this.nome}.`;
        this.emitirPrevia();
        this.cd.detectChanges();
      }
    });
  }

  private emitirPrevia() {
    this.previaChange.emit(this.previewLocal ?? (this.imagem.url && this.imagem.ativo ? this.imagem.url : null));
  }

  private liberarPreviewLocal() {
    if (this.previewLocal) URL.revokeObjectURL(this.previewLocal);
    this.previewLocal = null;
  }
}
