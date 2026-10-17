import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Plano, PlanoEmpresa } from '../models/plano.model';

/**
 * Planos de assinatura. GET /planos é público (landing page);
 * GET /planos/atual é o plano da empresa logada, com limites e uso.
 */
@Injectable({
  providedIn: 'root'
})
export class PlanoService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/planos`;

  listar(): Observable<Plano[]> {
    return this.http.get<Plano[]>(this.apiUrl);
  }

  atual(): Observable<PlanoEmpresa> {
    return this.http.get<PlanoEmpresa>(`${this.apiUrl}/atual`);
  }
}
