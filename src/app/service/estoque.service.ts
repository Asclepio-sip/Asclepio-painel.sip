import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EstoqueRequest {
  produtoId: number;
  lojaID: number;
  nomeLoja?: string;
  nomeProduto?: string;
  quantidade: number;
  precoVenda: number;
}

export interface Estoque {

  id: number;

  lojaId: number;
  nomeLoja: string;

  produtoId: number;
  nomeProduto: string;

  imagemBase64: string;

  quantidade: number;

  precoVenda: number;

  percentualDesconto: number;

  valorFinal: number;

  variacao: string;

  Entregar: string;
}

export interface PageResponse<T> {

  content: T[];

  page: {

    size: number;
    number: number;

    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {

  private api = `${environment.apiUrl}/estoque`;

  constructor(
    private http: HttpClient
  ) {}

  salvar(data: EstoqueRequest): Observable<any> {

    return this.http.post(
      this.api,
      data
    );
  }

  listar(
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<Estoque>> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResponse<Estoque>>(
      `${this.api}/relatorio`,
      { params }
    );
  }

  filtrar(
    lojaId?: number,
    nomeLoja?: string,
    semEstoque?: boolean
  ): Observable<Estoque[]> {

    let params = new HttpParams();

    if (lojaId !== undefined) {
      params = params.set(
        'lojaId',
        lojaId
      );
    }

    if (nomeLoja) {
      params = params.set(
        'nomeLoja',
        nomeLoja
      );
    }

    if (semEstoque !== undefined) {
      params = params.set(
        'semEstoque',
        semEstoque
      );
    }

    return this.http.get<Estoque[]>(
      `${this.api}/filtro`,
      { params }
    );
  }


  atualizarEstoque(
  data: Partial<EstoqueRequest>
): Observable<any> {

  return this.http.patch(
    `${this.api}`,
    data
  );
}
}