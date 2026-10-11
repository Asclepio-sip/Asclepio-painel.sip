import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Plano } from '../models/plano.model';

/** Planos de assinatura. GET /planos é público (usado na landing page). */
@Injectable({
  providedIn: 'root'
})
export class PlanoService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/planos`;

  listar(): Observable<Plano[]> {
    return this.http.get<Plano[]>(this.apiUrl);
  }
}
