import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UserLoja } from '../models/user-loja.model';

/**
 * Endpoints de UserLoja ainda não publicados pelo backend (arquitetura em migração).
 * `listarPorLoja` usa `/loja/{id}/usuarios`, que é uma suposição isolada aqui — os
 * demais (`/user-loja`, `/user/{id}/lojas`) foram confirmados pelo time de backend.
 * Ajustar aqui quando o contrato final estiver no ar.
 */
@Injectable({
  providedIn: 'root'
})
export class UserLojaService {

  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarPorLoja(lojaId: number) {
    return this.http.get<UserLoja[]>(`${this.API}/loja/${lojaId}/usuarios`);
  }

  listarLojasDoUsuario(userId: string) {
    return this.http.get<UserLoja[]>(`${this.API}/user/${userId}/lojas`);
  }

  criarVinculo(data: { userId: string; lojaId: number; roleId: string }) {
    return this.http.post<UserLoja>(`${this.API}/user-loja`, data);
  }

  atualizarCargo(userLojaId: string, roleId: string) {
    return this.http.put<UserLoja>(`${this.API}/user-loja/${userLojaId}`, { roleId });
  }

  removerVinculo(userLojaId: string) {
    return this.http.delete<void>(`${this.API}/user-loja/${userLojaId}`);
  }
}
