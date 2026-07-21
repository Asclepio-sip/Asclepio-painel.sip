import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Empresa {
  id?: number;
  nome: string;
  cnpj: string;
  ativa: boolean;
  criadoEm?: string;
}

export interface EmpresaFiltro {
  nome?: string;
  cnpj?: string;
  ativa?: boolean;
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
export class EmpresaService {

  private apiUrl = `${environment.apiUrl}/empresas`;

  constructor(private http: HttpClient) {}

  listar(
    page: number = 0,
    size: number = 20,
    filtros: EmpresaFiltro = {},
    sort: string[] = []
  ): Observable<PageResponse<Empresa>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    params = this.adicionarParametro(params, 'nome', filtros.nome);
    params = this.adicionarParametro(params, 'cnpj', filtros.cnpj);

    if (filtros.ativa !== undefined && filtros.ativa !== null) {
      params = params.set('ativa', String(filtros.ativa));
    }

    sort.forEach(item => {
      params = params.append('sort', item);
    });

    return this.http.get<PageResponse<Empresa>>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/${id}`);
  }

  criar(empresa: Empresa): Observable<Empresa> {
    return this.http.post<Empresa>(this.apiUrl, this.normalizarEmpresa(empresa));
  }

  atualizar(id: number, empresa: Empresa): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/${id}`, this.normalizarEmpresa(empresa));
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private normalizarEmpresa(empresa: Empresa): Empresa {
    return {
      ...empresa,
      nome: empresa.nome?.trim() ?? '',
      cnpj: empresa.cnpj?.trim() ?? ''
    };
  }

  private adicionarParametro(
    params: HttpParams,
    chave: string,
    valor: string | number | boolean | null | undefined
  ) {
    if (valor === null || valor === undefined || valor === '') {
      return params;
    }

    return params.set(chave, String(valor));
  }
}