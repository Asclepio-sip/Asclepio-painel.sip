/** GET /config-conta e resposta do PATCH /config-conta/catalogo-online. */
export interface ConfigConta {
  id: number;
  empresaId: number;
  catalogoOnlineAtivo: boolean;
  /** Nome do link público (ex.: "farmacia-central"). null enquanto não for definido. */
  nomeLink: string | null;
  atualizadoEm: string;
}

/** Item de GET /catalogo-online/lojas/{lojaId}/produtos (rota pública). */
export interface CatalogoProduto {
  estoqueId: number;
  produtoId: number;
  variacaoId: number;
  nomeProduto: string;
  nomeVariacao: string | null;
  imagemUrl: string | null;
  precoVenda: number;
  percentualDesconto: number | null;
  /** Já vem com o desconto aplicado pelo backend — não recalcular no front. */
  valorFinal: number;
  emPromocao: boolean;
}

export interface CatalogoFiltro {
  nomeProduto?: string;
  categoriaId?: number | null;
  somentePromocao?: boolean;
}

export interface CatalogoPagina {
  produtos: CatalogoProduto[];
  totalElements: number;
  totalPages: number;
  number: number;
}

/** Loja listada no catálogo público (GET /catalogo-online/{nomeLink}/lojas). */
export interface CatalogoLoja {
  id: number;
  nomeLoja: string;
}

/** Categoria ativa da empresa (GET /catalogo-online/{nomeLink}/categorias), já em ordem de nome. */
export interface CatalogoCategoria {
  /** Vai no filtro de produtos (?categoriaId=). */
  id: number;
  nomeCategoria: string;
  icone: string | null;
  categoriaPaiId: number | null;
}

// ── Pedido pelo catálogo (rotas públicas /catalogo-online/{nomeLink}/lojas/{lojaId}/...) ──

/** Só estes chegam no checkout: BALCAO é barrado no catálogo e ENTREGA_TERCEIRIZADA não existe no backend ainda. */
export type TipoAtendimentoCatalogo = 'RETIRADA_NA_LOJA' | 'ENTREGA_PROPRIA';

export interface CatalogoFormaPagamento {
  /** Enum FormaDePagamento — é o que vai em formaDePagamento no pedido. */
  forma: string;
  /** Texto para mostrar na tela. */
  descricao: string;
}

export interface CatalogoBairro {
  bairroId: number;
  nomeBairro: string;
  valorFrete: number;
}

/** GET .../checkout: o que o cliente pode escolher ao finalizar. */
export interface CatalogoCheckout {
  lojaId: number;
  nomeLoja: string;
  tiposAtendimento: TipoAtendimentoCatalogo[];
  formasPagamento: CatalogoFormaPagamento[];
  /** Vazio se a loja não entrega. */
  bairros: CatalogoBairro[];
  /** A partir desse subtotal o frete é zero; null = sem frete grátis. */
  valorMinimoFreteGratis: number | null;
}

/** Item do carrinho (uma linha por variação — quantidades da mesma variação são somadas). */
export interface CatalogoCarrinhoItem {
  variacaoId: number;
  nomeProduto: string;
  nomeVariacao: string | null;
  imagemUrl: string | null;
  /** Estimativa com o preço da vitrine; o valor real é calculado pelo backend. */
  valorFinal: number;
  quantidade: number;
}

// O carrinho é compartilhado entre o catálogo e a página de finalizar via localStorage (um por loja).
function chaveCarrinho(nomeLink: string, lojaId: number): string {
  return `catalogo-carrinho:${nomeLink}:${lojaId}`;
}

export function lerCarrinho(nomeLink: string, lojaId: number): CatalogoCarrinhoItem[] {
  try {
    const salvo = JSON.parse(localStorage.getItem(chaveCarrinho(nomeLink, lojaId)) ?? '[]');
    return Array.isArray(salvo)
      ? salvo.filter(i => i && typeof i.variacaoId === 'number' && i.quantidade > 0)
      : [];
  } catch {
    return []; // navegador sem storage: carrinho só em memória
  }
}

export function gravarCarrinho(nomeLink: string, lojaId: number, itens: CatalogoCarrinhoItem[]) {
  try {
    if (itens.length) localStorage.setItem(chaveCarrinho(nomeLink, lojaId), JSON.stringify(itens));
    else localStorage.removeItem(chaveCarrinho(nomeLink, lojaId));
  } catch { /* idem */ }
}

/** POST .../pedidos. Cada variação só pode aparecer uma vez. */
export interface CatalogoPedidoRequest {
  bairroId: number | null;
  nomeCliente: string;
  email: string | null;
  telefone: string;
  endereco: string | null;
  complemento: string | null;
  observacao: string | null;
  tipoAtendimentoPedido: TipoAtendimentoCatalogo;
  formaDePagamento: string;
  itens: { variacaoId: number; quantidade: number }[];
}

export interface CatalogoPedidoResponse {
  codigoRastreio: string;
  status: string;
  /** Rota pública da API: /pedidos/status/{codigoRastreio}. */
  statusUrl: string;
}

// ── Acompanhar pedido (GET /pedidos/status/{codigoRastreio}, público) ──

export type StatusPedido = 'AGUARDANDO' | 'SEPARACAO' | 'EM_TRANSITO' | 'CONCLUIDO' | 'CANCELADO';

/** Só código e status — a rota não expõe dados do cliente. */
export interface PedidoStatusPublico {
  codigoRastreio: string;
  status: StatusPedido;
}

/** Código gerado pelo backend: 20 caracteres A–Z/0–9. */
export const CODIGO_RASTREIO_REGEX = /^[A-Z0-9]{20}$/;

export function normalizarCodigoRastreio(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export interface PedidoRecente {
  codigo: string;
  /** ISO da criação no navegador (só para exibir "feito em"). */
  criadoEm: string;
}

const MAX_PEDIDOS_RECENTES = 5;

function chavePedidosRecentes(nomeLink: string): string {
  return `catalogo-pedidos:${nomeLink}`;
}

/** Códigos dos pedidos feitos neste navegador (o código é longo demais para o cliente digitar). */
export function lerPedidosRecentes(nomeLink: string): PedidoRecente[] {
  try {
    const salvo = JSON.parse(localStorage.getItem(chavePedidosRecentes(nomeLink)) ?? '[]');
    return Array.isArray(salvo) ? salvo.filter(p => p && typeof p.codigo === 'string') : [];
  } catch {
    return [];
  }
}

export function guardarPedidoRecente(nomeLink: string, codigo: string) {
  const lista = [{ codigo, criadoEm: new Date().toISOString() }, ...lerPedidosRecentes(nomeLink).filter(p => p.codigo !== codigo)];
  try {
    localStorage.setItem(chavePedidosRecentes(nomeLink), JSON.stringify(lista.slice(0, MAX_PEDIDOS_RECENTES)));
  } catch { /* sem storage: só não lembra */ }
}

/** Mesma regra do NomeLinkRequest do backend. */
export const NOME_LINK_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const NOME_LINK_MIN = 3;
export const NOME_LINK_MAX = 60;

// ── Design do catálogo (GET/PUT /config-conta/design-catalogo e GET público /catalogo-online/{nomeLink}/design) ──

export type ModeloCardCatalogo = 'PADRAO' | 'RETANGULAR' | 'GRANDE' | 'COMPACTO';

/** Layout do topo do catálogo público (o backend só guarda a escolha; o desenho é do front). */
export type ModeloNavbarCatalogo = 'PADRAO' | 'LOGO_BUSCA_CATEGORIAS_HORIZONTAL' | 'LOGO_BUSCA_BOTAO_CATEGORIAS';

/** O PUT substitui tudo: campo vazio/null é apagado, então sempre mande o objeto inteiro. */
export interface DesignCatalogo {
  modeloCard: ModeloCardCatalogo;
  /** Vazio/não enviado = PADRAO. */
  modeloNavbar: ModeloNavbarCatalogo;
  descricaoRodape: string | null;
  /** Só dígitos com DDD (10 a 13). */
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  emailSuporte: string | null;
  /** Só dígitos com DDD (10 a 13). */
  telefoneSuporte: string | null;
  /** Botão flutuante do WhatsApp na página pública. Ligado exige `whatsapp` (senão 400). */
  mostrarBotaoWhatsapp: boolean;
  /** Instagram/Facebook/TikTok no rodapé. O backend trata null como ligado. */
  mostrarIconesRedesSociais: boolean;
  /** #RRGGBB; null = cor padrão (ver CORES_PADRAO). */
  corPrimaria: string | null;
  corSecundaria: string | null;
  corFundo: string | null;
  /** Fundo da navbar (#RRGGBB; null = branco). */
  corNavbar: string | null;
  /** Texto e ícones da navbar (#RRGGBB; null = cinza escuro). Não é automático: a empresa escolhe. */
  corTextoNavbar: string | null;
  /** Só na resposta (não vão no PUT): URL quando existe E está ativo; senão null. */
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

/** Cores usadas quando a empresa não escolheu nenhuma (campo null). */
export const CORES_PADRAO = {
  primaria: '#C5794E',
  secundaria: '#1F2937',
  fundo: '#F4F6F8',
  navbar: '#FFFFFF',
  textoNavbar: '#1F2937',
} as const;

export const COR_HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

function luminancia(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Texto legível (escuro ou branco) sobre a cor de fundo informada. */
export function corTextoSobre(hex: string): string {
  return luminancia(hex) > 0.45 ? '#111827' : '#FFFFFF';
}

/** Razão de contraste WCAG (1 a 21). Abaixo de 3 o texto fica difícil de ler. */
export function contraste(hexA: string, hexB: string): number {
  const [claro, escuro] = [luminancia(hexA), luminancia(hexB)].sort((a, b) => b - a);
  return (claro + 0.05) / (escuro + 0.05);
}

/** Variáveis CSS do tema do catálogo (página pública e prévia do painel). */
export function variaveisTema(
  design: Pick<DesignCatalogo, 'corPrimaria' | 'corSecundaria' | 'corFundo' | 'corNavbar' | 'corTextoNavbar'>
): Record<string, string> {
  const primaria = design.corPrimaria || CORES_PADRAO.primaria;
  const secundaria = design.corSecundaria || CORES_PADRAO.secundaria;
  const fundo = design.corFundo || CORES_PADRAO.fundo;
  return {
    '--cor-primaria': primaria,
    '--cor-primaria-texto': corTextoSobre(primaria),
    '--cor-secundaria': secundaria,
    '--cor-secundaria-texto': corTextoSobre(secundaria),
    '--cor-fundo': fundo,
    '--cor-fundo-texto': corTextoSobre(fundo),
    '--cor-navbar': design.corNavbar || CORES_PADRAO.navbar,
    '--cor-navbar-texto': design.corTextoNavbar || CORES_PADRAO.textoNavbar,
  };
}

export function linkWhatsapp(numero: string): string {
  // wa.me exige DDI: número com 10/11 dígitos é brasileiro, recebe 55.
  return `https://wa.me/${numero.length <= 11 ? `55${numero}` : numero}`;
}

/** Imagens do catálogo com upload próprio (multipart, campo "imagem"): /config-conta/banner e /config-conta/logo. */
export type TipoImagemCatalogo = 'banner' | 'logo';

/** GET /config-conta/{tipo} normalizado. url null = ainda não enviada. */
export interface ImagemCatalogo {
  url: string | null;
  ativo: boolean;
}

/** Acima disso o backend responde 500 em vez de 400 — o front barra antes. */
export const IMAGEM_TAMANHO_MAXIMO = 15 * 1024 * 1024;

export const DESIGN_PADRAO: DesignCatalogo = {
  modeloCard: 'PADRAO',
  modeloNavbar: 'PADRAO',
  descricaoRodape: null,
  whatsapp: null,
  instagram: null,
  facebook: null,
  tiktok: null,
  emailSuporte: null,
  telefoneSuporte: null,
  mostrarBotaoWhatsapp: false,
  mostrarIconesRedesSociais: true,
  corPrimaria: null,
  corSecundaria: null,
  corFundo: null,
  corNavbar: null,
  corTextoNavbar: null,
};

/** Resposta do backend → DesignCatalogo com os defaults aplicados (null nos booleanos tem significado). */
export function normalizarDesign(d: Partial<DesignCatalogo> | null | undefined): DesignCatalogo {
  return {
    ...DESIGN_PADRAO,
    ...d,
    modeloCard: d?.modeloCard ?? 'PADRAO',
    modeloNavbar: d?.modeloNavbar ?? 'PADRAO',
    mostrarBotaoWhatsapp: d?.mostrarBotaoWhatsapp ?? false,
    mostrarIconesRedesSociais: d?.mostrarIconesRedesSociais ?? true,
  };
}

export type TipoContato = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'email' | 'telefone';

export interface ContatoRodape {
  tipo: TipoContato;
  rotulo: string;
  href: string;
}

/** (11) 9 9999-9999 / (11) 3333-4444; com DDI (12–13 dígitos) prefixa +55. Recebe só dígitos. */
export function formatarTelefone(d: string): string {
  if (d.length > 11) {
    const ddi = d.slice(0, d.length - 11);
    return `+${ddi} ${formatarTelefone(d.slice(-11))}`;
  }
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

/** Aceita "@usuario", "usuario" ou link completo. */
function linkRede(valor: string, base: string, prefixoUsuario = ''): { href: string; rotulo: string } {
  const v = valor.trim();
  if (/^https?:\/\//i.test(v)) {
    return { href: v, rotulo: v.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '') };
  }
  const usuario = v.replace(/^@/, '');
  return { href: `${base}${prefixoUsuario}${encodeURIComponent(usuario)}`, rotulo: `@${usuario}` };
}

/** Monta os contatos do rodapé na ordem de exibição, pulando os vazios. */
export function contatosRodape(design: DesignCatalogo): ContatoRodape[] {
  const contatos: ContatoRodape[] = [];

  if (design.whatsapp) {
    contatos.push({ tipo: 'whatsapp', rotulo: formatarTelefone(design.whatsapp), href: linkWhatsapp(design.whatsapp) });
  }
  if (design.mostrarIconesRedesSociais !== false) {
    if (design.instagram) contatos.push({ tipo: 'instagram', ...linkRede(design.instagram, 'https://instagram.com/') });
    if (design.facebook) contatos.push({ tipo: 'facebook', ...linkRede(design.facebook, 'https://facebook.com/') });
    if (design.tiktok) contatos.push({ tipo: 'tiktok', ...linkRede(design.tiktok, 'https://www.tiktok.com/', '@') });
  }
  if (design.emailSuporte) contatos.push({ tipo: 'email', rotulo: design.emailSuporte, href: `mailto:${design.emailSuporte}` });
  if (design.telefoneSuporte) {
    contatos.push({ tipo: 'telefone', rotulo: formatarTelefone(design.telefoneSuporte), href: `tel:+${design.telefoneSuporte.length <= 11 ? '55' : ''}${design.telefoneSuporte}` });
  }

  return contatos;
}
