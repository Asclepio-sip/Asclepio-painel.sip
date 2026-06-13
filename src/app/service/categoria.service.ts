import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ✅ campo corrigido para bater com o que o backend retorna
export interface Categoria {
  id: number;
  nomeCategoria: string;
  descricao?: string;
  categoriaPaiId?: number | null;
  categoriaPai?: Categoria | null;
}

export interface CategoriaRequest {
  nomeCategoria: string;
  descricao?: string;
  categoriaPaiId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  private apiUrl =
    `${environment.apiUrl}/categorias`;

  constructor(
    private http: HttpClient
  ) {}

  listar():
    Observable<Categoria[]> {

    return this.http.get<
      Categoria[]
    >(this.apiUrl);
  }

  criar(categoria: CategoriaRequest) {

    return this.http.post(
      this.apiUrl,
      categoria
    );
  }

  atualizar(
    id: number,
    categoria: CategoriaRequest
  ) {

    return this.http.put(
      `${this.apiUrl}/${id}`,
      categoria
    );
  }

  deletar(
    id: number
  ) {

    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }
}
