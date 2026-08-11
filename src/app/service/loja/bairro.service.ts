import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
export interface Bairro {
  id?: number;
  nome: string;
}

interface PageResponse<T> {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BairroService {


    private apiUrl = `${environment.apiUrl}/bairro`;

  constructor(
    private http: HttpClient
  ) {}

  listar():
    Observable<Bairro[]> {

    const params = new HttpParams().set('size', '1000');

    return this.http.get<PageResponse<Bairro>>(
      this.apiUrl,
      { params }
    ).pipe(
      map(resposta => resposta.content)
    );
  }

  criar(
    bairro: Bairro
  ): Observable<Bairro> {

    return this.http.post<Bairro>(
      this.apiUrl,
      bairro
    );
  }

  deletar(id: number) {

    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }
}
