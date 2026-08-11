import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Loja {
  id?: number;
  nomeLoja: string;
  cep: string;
  cnpj?: string | null;
  telefone: string;
  textoDescricao?: string | null;
  tipoAtendimento: string;
  valorMinimoFreteGratis?: number | null;
  imagemUrl?: string | null;
}

/**
 * O back-end responde com "cpnj" (typo) e "TextoDescricao" (com T maiusculo)
 * em vez de "cnpj"/"textoDescricao". Isso normaliza pra manter o resto do
 * front-end trabalhando com os nomes de campo corretos.
 */
interface LojaResponseBruta {
  id?: number;
  nomeLoja: string;
  cep: string;
  cpnj?: string | null;
  telefone: string;
  TextoDescricao?: string | null;
  tipoAtendimento: string;
  valorMinimoFreteGratis?: number | null;
  imagemUrl?: string | null;
}

export interface LojaFiltro {
  id?: number | null;
  nomeLoja?: string;
  cep?: string;
  cnpj?: string;
  telefone?: string;
  tipoAtendimento?: string;
}

export interface PageResponse<T> {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  size?: number;
  number?: number;
  totalElements?: number;
  totalPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LojaService {

  private apiUrl = `${environment.apiUrl}/lojas`;

  constructor(private http: HttpClient) {}

  listar(
    page: number = 0,
    size: number = 20,
    filtros: LojaFiltro = {}
  ): Observable<PageResponse<Loja>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    params = this.adicionarParametro(params, 'id', filtros.id);
    params = this.adicionarParametro(params, 'nomeLoja', filtros.nomeLoja);
    params = this.adicionarParametro(params, 'cep', filtros.cep);
    params = this.adicionarParametro(params, 'cnpj', filtros.cnpj);
    params = this.adicionarParametro(params, 'telefone', filtros.telefone);
    params = this.adicionarParametro(params, 'tipoAtendimento', filtros.tipoAtendimento);

    return this.http.get<PageResponse<LojaResponseBruta>>(this.apiUrl, { params }).pipe(
      map(response => ({
        ...response,
        content: response.content.map(loja => this.normalizarLojaResponse(loja))
      }))
    );
  }

  criar(loja: Loja) {
    return this.http.post(this.apiUrl, this.normalizarLojaRequest(loja));
  }

  atualizar(id: number, loja: Loja) {
    return this.http.put(`${this.apiUrl}/${id}`, this.normalizarLojaRequest(loja));
  }

  deletar(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Nao existe GET /lojas/{id} no back-end — so o GET /lojas (com filtro por
   * id) que existe. Reaproveita o listar() pra buscar uma loja so.
   */
  buscarPorId(id: number): Observable<Loja> {
    return this.listar(0, 1, { id }).pipe(
      map(response => {
        const loja = response.content[0];

        if (!loja) {
          throw new Error(`Loja ${id} nao encontrada.`);
        }

        return loja;
      })
    );
  }

  private normalizarLojaRequest(loja: Loja) {
    const tipoAtendimento =
      loja.tipoAtendimento === 'DELIVERY'
        ? 'ENTREGA'
        : loja.tipoAtendimento === 'PRESENCIAL'
          ? 'RETIRADA'
          : loja.tipoAtendimento;

    return {
      nomeLoja: loja.nomeLoja,
      cep: loja.cep,
      cnpj: loja.cnpj || null,
      telefone: loja.telefone,
      // Campo do back-end e literalmente "TextoDescricao", com T maiusculo.
      TextoDescricao: loja.textoDescricao || null,
      imagemUrl: loja.imagemUrl || null,
      tipoAtendimento,
      valorMinimoFreteGratis: loja.valorMinimoFreteGratis ?? null
    };
  }

  private normalizarLojaResponse(loja: LojaResponseBruta): Loja {
    return {
      id: loja.id,
      nomeLoja: loja.nomeLoja,
      cep: loja.cep,
      cnpj: loja.cpnj ?? null,
      telefone: loja.telefone,
      textoDescricao: loja.TextoDescricao ?? null,
      tipoAtendimento: loja.tipoAtendimento,
      valorMinimoFreteGratis: loja.valorMinimoFreteGratis ?? null,
      imagemUrl: loja.imagemUrl ?? null
    };
  }

  private adicionarParametro(
    params: HttpParams,
    chave: string,
    valor: string | number | null | undefined
  ) {
    if (valor === null || valor === undefined || valor === '') {
      return params;
    }

    return params.set(chave, String(valor));
  }
}
