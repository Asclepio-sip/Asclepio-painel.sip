import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CatalogoOnlineService } from '../../service/catalogo-online.service';
import { AuthService } from '../../service/auth.service';
import { AppPermissions } from '../../core/security/app-permissions';
import {
  COR_HEX_REGEX, CORES_PADRAO, contraste, DESIGN_PADRAO, DesignCatalogo, ModeloCardCatalogo, ModeloNavbarCatalogo, formatarTelefone,
  NOME_LINK_MAX, NOME_LINK_MIN, NOME_LINK_REGEX, normalizarDesign, variaveisTema
} from '../../models/catalogo-online.model';
import { CatalogoRodape } from '../../shared/catalogo-rodape/catalogo-rodape';
import { CatalogoImagemUpload } from '../../shared/catalogo-imagem-upload/catalogo-imagem-upload';

type CampoTelefone = 'whatsapp' | 'telefoneSuporte';
type CampoCor = 'corPrimaria' | 'corSecundaria' | 'corFundo' | 'corNavbar' | 'corTextoNavbar';

/**
 * Painel do catálogo online, tudo numa tela: liga/desliga + link público, logo, banner,
 * cores, modelo de card e rodapé (descrição, redes sociais, contatos e botão do WhatsApp).
 */
@Component({
  selector: 'app-catalogo-design',
  standalone: true,
  imports: [CommonModule, FormsModule, CatalogoRodape, CatalogoImagemUpload],
  templateUrl: './catalogo-design.html',
  styleUrl: './catalogo-design.css',
})
export class CatalogoDesign implements OnInit {

  readonly limiteDescricao = 1000;
  readonly limiteRede = 150;

  readonly modelos: { valor: ModeloCardCatalogo; nome: string; descricao: string }[] = [
    { valor: 'PADRAO', nome: 'Padrão', descricao: 'Grade equilibrada, bom para a maioria das lojas' },
    { valor: 'RETANGULAR', nome: 'Retangular', descricao: 'Foto ao lado do nome, lista mais fácil de ler' },
    { valor: 'GRANDE', nome: 'Grande', descricao: 'Fotos grandes, destaque para poucos produtos' },
    { valor: 'COMPACTO', nome: 'Compacto', descricao: 'Mais produtos por tela, ideal para catálogo grande' },
  ];

  readonly modelosNavbar: { valor: ModeloNavbarCatalogo; nome: string; descricao: string; mini: string }[] = [
    { valor: 'PADRAO', nome: 'Padrão', descricao: 'Logo e nome no topo; busca e filtros logo abaixo', mini: 'padrao' },
    { valor: 'LOGO_BUSCA_CATEGORIAS_HORIZONTAL', nome: 'Busca + categorias', descricao: 'Busca no topo e as categorias em linha, sempre visíveis', mini: 'horizontal' },
    { valor: 'LOGO_BUSCA_BOTAO_CATEGORIAS', nome: 'Busca + botão', descricao: 'Busca no topo e um botão que abre a lista de categorias', mini: 'botao' },
  ];

  readonly cores: { campo: CampoCor; nome: string; descricao: string; padrao: string }[] = [
    { campo: 'corPrimaria', nome: 'Cor principal', descricao: 'Botões, preços em destaque e filtros ativos', padrao: CORES_PADRAO.primaria },
    { campo: 'corSecundaria', nome: 'Cor secundária', descricao: 'Fundo do rodapé', padrao: CORES_PADRAO.secundaria },
    { campo: 'corFundo', nome: 'Cor de fundo', descricao: 'Fundo da página, atrás dos produtos', padrao: CORES_PADRAO.fundo },
    { campo: 'corNavbar', nome: 'Fundo do topo', descricao: 'Fundo da barra do topo (logo, busca e categorias)', padrao: CORES_PADRAO.navbar },
    { campo: 'corTextoNavbar', nome: 'Texto do topo', descricao: 'Nome da loja e ícones da barra do topo', padrao: CORES_PADRAO.textoNavbar },
  ];

  design: DesignCatalogo = { ...DESIGN_PADRAO };
  /** Snapshot do que está salvo, pra saber se há alteração pendente. */
  private salvo: DesignCatalogo = { ...DESIGN_PADRAO };

  carregando = true;
  erroCarregar = false;
  salvando = false;
  podeEditar = false;
  erroSalvar = '';
  sucesso = false;

  // Liga/desliga (vale para a empresa inteira) — PATCH /config-conta/catalogo-online
  catalogoAtivo = false;
  alterandoCatalogo = false;
  confirmandoDesativar = false;

  // Link público: <origin>/catalogo/{nomeLink}
  readonly nomeLinkMax = NOME_LINK_MAX;
  nomeLink: string | null = null;
  editandoNomeLink = false;
  nomeLinkDigitado = '';
  salvandoNomeLink = false;
  erroNomeLink = '';
  linkCopiado = false;

  // Prévia das imagens (vem dos cards de upload: escolhida ainda não enviada, ou a salva se ativa)
  logoPrevia: string | null = null;
  bannerPrevia: string | null = null;

  constructor(
    private catalogoOnlineService: CatalogoOnlineService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.podeEditar = this.authService.isSuperAdmin() ||
      this.authService.hasPermission(AppPermissions.ConfigConta.update);
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.erroCarregar = false;

    forkJoin({
      design: this.catalogoOnlineService.getDesign(),
      config: this.catalogoOnlineService.getConfig()
    }).subscribe({
      next: ({ design, config }) => {
        this.design = normalizarDesign(design);
        this.salvo = { ...this.design };
        this.catalogoAtivo = config.catalogoOnlineAtivo;
        this.nomeLink = config.nomeLink || null;
        this.carregando = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.erroCarregar = true;
        this.carregando = false;
        this.cd.detectChanges();
      }
    });
  }

  get alterado(): boolean {
    return JSON.stringify(this.normalizar(this.design)) !== JSON.stringify(this.normalizar(this.salvo));
  }

  escolherNavbar(modelo: ModeloNavbarCatalogo) {
    if (!this.podeEditar) return;
    this.design.modeloNavbar = modelo;
    this.limparAvisos();
  }

  escolherModelo(modelo: ModeloCardCatalogo) {
    if (!this.podeEditar) return;
    this.design.modeloCard = modelo;
    this.limparAvisos();
  }

  telefoneFormatado(campo: CampoTelefone): string {
    return formatarTelefone(this.design[campo] ?? '');
  }

  /** Mostra formatado, guarda só dígitos (10 a 13, como o backend exige). */
  onTelefoneInput(event: Event, campo: CampoTelefone) {
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 13);
    input.value = formatarTelefone(digitos);
    this.design[campo] = digitos || null;
    this.limparAvisos();
  }

  limparAvisos() {
    this.erroSalvar = '';
    this.sucesso = false;
  }

  // ── Cores ──

  corAtual(campo: CampoCor, padrao: string): string {
    return this.design[campo] || padrao;
  }

  /** input type=color sempre devolve #rrggbb; guardamos em maiúsculas como no exemplo do backend. */
  onCorEscolhida(campo: CampoCor, valor: string) {
    this.design[campo] = valor.toUpperCase();
    this.limparAvisos();
  }

  onCorDigitada(campo: CampoCor, event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.trim().toUpperCase().replace(/[^#0-9A-F]/g, '');
    if (valor && !valor.startsWith('#')) valor = '#' + valor;
    valor = valor.slice(0, 7);
    input.value = valor;
    // Só aplica quando estiver completo; campo vazio volta pro padrão.
    if (!valor) this.design[campo] = null;
    else if (COR_HEX_REGEX.test(valor)) this.design[campo] = valor;
    this.limparAvisos();
  }

  restaurarCor(campo: CampoCor) {
    this.design[campo] = null;
    this.limparAvisos();
  }

  /** A cor do texto do topo é escolhida à mão, então avisamos quando some no fundo (não bloqueia o salvar). */
  get contrasteNavbarBaixo(): boolean {
    return contraste(
      this.corAtual('corNavbar', CORES_PADRAO.navbar),
      this.corAtual('corTextoNavbar', CORES_PADRAO.textoNavbar)
    ) < 3;
  }

  get temaPrevia(): Record<string, string> {
    return variaveisTema(this.design);
  }

  onWhatsappBotaoChange(ligado: boolean) {
    this.design.mostrarBotaoWhatsapp = ligado;
    this.limparAvisos();
  }

  private validar(): string {
    for (const [campo, nome] of [['whatsapp', 'WhatsApp'], ['telefoneSuporte', 'Telefone de suporte']] as const) {
      const valor = this.design[campo];
      if (valor && (valor.length < 10 || valor.length > 13)) {
        return `${nome} incompleto: informe o DDD e o número.`;
      }
    }

    if (this.design.mostrarBotaoWhatsapp && !this.design.whatsapp) {
      return 'Informe o número do WhatsApp para mostrar o botão flutuante.';
    }

    for (const cor of this.cores) {
      const valor = this.design[cor.campo];
      if (valor && !COR_HEX_REGEX.test(valor)) return `${cor.nome} inválida: use o formato #RRGGBB.`;
    }

    const email = this.design.emailSuporte?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'E-mail de suporte inválido.';
    }

    return '';
  }

  /** Campos em branco viram null (o backend apaga) e textos vão sem espaços nas pontas. */
  private normalizar(d: DesignCatalogo): DesignCatalogo {
    const texto = (v: string | null) => (v ?? '').trim() || null;
    return {
      modeloCard: d.modeloCard,
      modeloNavbar: d.modeloNavbar,
      descricaoRodape: texto(d.descricaoRodape),
      whatsapp: texto(d.whatsapp),
      instagram: texto(d.instagram),
      facebook: texto(d.facebook),
      tiktok: texto(d.tiktok),
      emailSuporte: texto(d.emailSuporte),
      telefoneSuporte: texto(d.telefoneSuporte),
      mostrarBotaoWhatsapp: !!d.mostrarBotaoWhatsapp,
      mostrarIconesRedesSociais: d.mostrarIconesRedesSociais !== false,
      corPrimaria: texto(d.corPrimaria),
      corSecundaria: texto(d.corSecundaria),
      corFundo: texto(d.corFundo),
      corNavbar: texto(d.corNavbar),
      corTextoNavbar: texto(d.corTextoNavbar),
    };
  }

  salvar() {
    this.limparAvisos();
    this.erroSalvar = this.validar();
    if (this.erroSalvar) return;

    // PUT substitui tudo: manda o formulário inteiro, inclusive o que não mudou.
    const payload = this.normalizar(this.design);

    this.salvando = true;
    this.catalogoOnlineService.salvarDesign(payload).subscribe({
      next: design => {
        this.design = normalizarDesign(design);
        this.salvo = { ...this.design };
        this.salvando = false;
        this.sucesso = true;
        this.cd.detectChanges();
      },
      error: err => {
        this.salvando = false;
        this.erroSalvar = err.error?.message || 'Não foi possível salvar o design do catálogo.';
        this.cd.detectChanges();
      }
    });
  }

  // ── Liga/desliga o catálogo ──

  alternarCatalogo() {
    if (this.catalogoAtivo) {
      this.confirmandoDesativar = true; // desligar esconde tudo dos clientes: pede confirmação
    } else {
      this.salvarCatalogoAtivo(true);
    }
  }

  cancelarDesativar() {
    this.confirmandoDesativar = false;
  }

  confirmarDesativar() {
    this.confirmandoDesativar = false;
    this.salvarCatalogoAtivo(false);
  }

  /** Troca otimista: pinta na hora, confirma com a resposta do PATCH e volta se falhar. */
  private salvarCatalogoAtivo(ativo: boolean) {
    const anterior = this.catalogoAtivo;
    this.catalogoAtivo = ativo;
    this.alterandoCatalogo = true;

    this.catalogoOnlineService.setCatalogo(ativo).subscribe({
      next: config => {
        this.catalogoAtivo = config.catalogoOnlineAtivo;
        this.alterandoCatalogo = false;
        this.cd.detectChanges();
      },
      error: err => {
        this.catalogoAtivo = anterior;
        this.alterandoCatalogo = false;
        this.cd.detectChanges();
        alert(err.error?.message || 'Não foi possível alterar o catálogo online.');
      }
    });
  }

  // ── Nome do link ──

  get prefixoLink(): string {
    return `${window.location.origin}/catalogo/`;
  }

  get linkPublico(): string {
    return this.nomeLink ? this.prefixoLink + this.nomeLink : '';
  }

  editarNomeLink() {
    this.nomeLinkDigitado = this.nomeLink ?? '';
    this.erroNomeLink = '';
    this.editandoNomeLink = true;
  }

  cancelarNomeLink() {
    this.editandoNomeLink = false;
    this.erroNomeLink = '';
  }

  /** Ajusta enquanto digita: minúsculas, sem acento, espaço vira hífen, tira o resto. */
  onNomeLinkInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const limpo = input.value
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, NOME_LINK_MAX);

    input.value = limpo;
    this.nomeLinkDigitado = limpo;
    this.erroNomeLink = '';
  }

  salvarNomeLink() {
    const nome = this.nomeLinkDigitado.replace(/^-+|-+$/g, '');
    this.nomeLinkDigitado = nome;

    if (nome.length < NOME_LINK_MIN) {
      this.erroNomeLink = `Use pelo menos ${NOME_LINK_MIN} caracteres.`;
      return;
    }
    if (!NOME_LINK_REGEX.test(nome)) {
      this.erroNomeLink = 'Use só letras minúsculas, números e hífen (sem hífen no começo ou no fim).';
      return;
    }
    if (nome === this.nomeLink) {
      this.editandoNomeLink = false;
      return;
    }

    this.salvandoNomeLink = true;
    this.catalogoOnlineService.salvarNomeLink(nome, !!this.nomeLink).subscribe({
      next: salvo => {
        this.nomeLink = salvo;
        this.editandoNomeLink = false;
        this.salvandoNomeLink = false;
        this.cd.detectChanges();
      },
      error: err => {
        this.salvandoNomeLink = false;
        this.erroNomeLink = err.status === 400 && err.error?.message
          ? err.error.message
          : 'Não foi possível salvar o nome do link. Tente novamente.';
        this.cd.detectChanges();
      }
    });
  }

  copiarLink() {
    if (!this.linkPublico) return;

    navigator.clipboard?.writeText(this.linkPublico).then(() => {
      this.linkCopiado = true;
      this.cd.detectChanges();
      setTimeout(() => {
        this.linkCopiado = false;
        this.cd.detectChanges();
      }, 2000);
    }).catch(() => alert('Não foi possível copiar. Selecione o link e copie manualmente.'));
  }

  descartar() {
    this.design = { ...this.salvo };
    this.limparAvisos();
  }
}
