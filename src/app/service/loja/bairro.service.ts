import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface Bairro {
  id?: number;
  nome: string;
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

    return this.http.get<Bairro[]>(
      this.apiUrl
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