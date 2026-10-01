import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CatalogoCategoria, CatalogoCheckout, CatalogoFiltro, CatalogoLoja, CatalogoPagina, CatalogoPedidoRequest,
  CatalogoPedidoResponse, CatalogoProduto, PedidoStatusPublico, ConfigConta, DesignCatalogo, ImagemCatalogo, TipoImagemCatalogo
} from '../models/catalogo-online.model';

interface PaginaBruta<T> {
  content?: T[];
  // VIA_DTO (formato atual do backend) manda os dados de página dentro de "page";
  // o formato antigo do Spring manda no nível de cima. Aceita os dois.
  page?: { number: number; size: number; totalElements: number; totalPages: number };
  number?: number;
  totalElements?: number;
  totalPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoOnlineService {

  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Painel admin (token FULL; permissões VerConfigConta / EditarConfigConta) ──

  getConfig() {
    return this.http.get<ConfigConta>(`${this.API}/config-conta`);
  }

  setCatalogo(ativo: boolean) {
    return this.http.patch<ConfigConta>(`${this.API}/config-conta/catalogo-online`, { ativo });
  }

  /** POST na primeira vez (201); PUT para trocar. O backend responde 400 se o nome já estiver em uso. */
  salvarNomeLink(nomeLink: string, jaExiste: boolean) {
    const url = `${this.API}/config-conta/nome-link`;
    const body = { nomeLink };
    const req = jaExiste
      ? this.http.put<{ nomeLink: string }>(url, body)
      : this.http.post<{ nomeLink: string }>(url, body);
    return req.pipe(map(res => res.nomeLink));
  }

  getDesign() {
    return this.http.get<DesignCatalogo>(`${this.API}/config-conta/design-catalogo`);
  }

  /** PUT substitui o design inteiro — mande todos os campos (vazio/null = apagar). 400 traz a mensagem da regra. */
  salvarDesign(design: DesignCatalogo) {
    return this.http.put<DesignCatalogo>(`${this.API}/config-conta/design-catalogo`, design);
  }

  // Banner e logo têm o mesmo contrato, só muda o nome dos campos (bannerUrl/bannerAtivo, logoUrl/logoAtivo).

  getImagem(tipo: TipoImagemCatalogo) {
    return this.http.get<Record<string, unknown>>(`${this.API}/config-conta/${tipo}`)
      .pipe(map(res => this.normalizarImagem(tipo, res)));
  }

  /** multipart, campo "imagem". POST na 1ª vez (já fica ativa); PUT para trocar (apaga a antiga; 404 se não existir). */
  enviarImagem(tipo: TipoImagemCatalogo, imagem: File, jaExiste: boolean) {
    const form = new FormData();
    form.append('imagem', imagem);
    const url = `${this.API}/config-conta/${tipo}`;
    const req = jaExiste
      ? this.http.put<Record<string, unknown>>(url, form)
      : this.http.post<Record<string, unknown>>(url, form);
    return req.pipe(map(res => this.normalizarImagem(tipo, res)));
  }

  /** Liga/desliga sem apagar a imagem. 404 se ainda não existir. */
  setImagemAtiva(tipo: TipoImagemCatalogo, ativo: boolean) {
    return this.http.patch<Record<string, unknown>>(`${this.API}/config-conta/${tipo}/status`, { ativo })
      .pipe(map(res => this.normalizarImagem(tipo, res)));
  }

  private normalizarImagem(tipo: TipoImagemCatalogo, res: Record<string, unknown>): ImagemCatalogo {
    return {
      url: (res[`${tipo}Url`] as string | null) ?? null,
      ativo: !!res[`${tipo}Ativo`],
    };
  }

  // ── Site público (sem login). 404 = nome não existe, catálogo desligado ou loja de outra empresa ──

  getDesignPublico(nomeLink: string) {
    return this.http.get<DesignCatalogo>(`${this.API}/catalogo-online/${encodeURIComponent(nomeLink)}/design`);
  }

  listarLojas(nomeLink: string) {
    return this.http.get<CatalogoLoja[]>(`${this.API}/catalogo-online/${encodeURIComponent(nomeLink)}/lojas`);
  }

  /** Só categorias ativas da empresa, em ordem de nome. */
  listarCategorias(nomeLink: string) {
    return this.http.get<CatalogoCategoria[]>(`${this.API}/catalogo-online/${encodeURIComponent(nomeLink)}/categorias`);
  }

  listarCatalogo(nomeLink: string, lojaId: number, filtro: CatalogoFiltro = {}, page = 0, size = 20) {
    let params = new HttpParams().set('page', page).set('size', size);

    const nome = filtro.nomeProduto?.trim();
    if (nome) params = params.set('nomeProduto', nome);
    if (filtro.categoriaId) params = params.set('categoriaId', filtro.categoriaId);
    if (filtro.somentePromocao) params = params.set('somentePromocao', true);

    return this.http
      .get<PaginaBruta<CatalogoProduto>>(
        `${this.API}/catalogo-online/${encodeURIComponent(nomeLink)}/lojas/${lojaId}/produtos`,
        { params }
      )
      .pipe(
        map((res): CatalogoPagina => {
          const produtos = res.content ?? [];
          return {
            produtos,
            totalElements: res.page?.totalElements ?? res.totalElements ?? produtos.length,
            totalPages: res.page?.totalPages ?? res.totalPages ?? 1,
            number: res.page?.number ?? res.number ?? page
          };
        })
      );
  }

  /** Tipos de atendimento, formas de pagamento ativas, bairros com frete e mínimo p/ frete grátis. */
  getCheckout(nomeLink: string, lojaId: number) {
    return this.http.get<CatalogoCheckout>(
      `${this.API}/catalogo-online/${encodeURIComponent(nomeLink)}/lojas/${lojaId}/checkout`
    );
  }

  /** 201 com o código de rastreio. 400 = dados/estoque; 429 = passou de 5 pedidos por minuto. */
  criarPedido(nomeLink: string, lojaId: number, pedido: CatalogoPedidoRequest) {
    return this.http.post<CatalogoPedidoResponse>(
      `${this.API}/catalogo-online/${encodeURIComponent(nomeLink)}/lojas/${lojaId}/pedidos`,
      pedido
    );
  }

  /**
   * Status público do pedido. 404 = código não existe; 400 = pedido concluído há mais de 24h
   * ("O prazo para acompanhamento deste pedido foi encerrado").
   */
  consultarStatus(codigoRastreio: string) {
    return this.http.get<PedidoStatusPublico>(`${this.API}/pedidos/status/${encodeURIComponent(codigoRastreio)}`);
  }
}
