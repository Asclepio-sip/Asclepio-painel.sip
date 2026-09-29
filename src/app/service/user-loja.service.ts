import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { LojaDoUsuario, UserLoja } from '../models/user-loja.model';

/**
 * `listarLojasDoUsuario` e `atualizarLojasDoUsuario` (GET/PUT `/user/{id}/lojas`) já estão
 * publicados no backend. `listarPorLoja` (`/loja/{id}/usuarios`) ainda não existe — ajustar
 * aqui quando o contrato final estiver no ar.
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
    return this.http.get<LojaDoUsuario[]>(`${this.API}/user/${userId}/lojas`);
  }

  /** Substitui todas as lojas/cargos do usuário: lojas fora da lista perdem o acesso. */
  atualizarLojasDoUsuario(userId: string, lojas: { lojaId: number; roleId: string }[]) {
    return this.http.put<void>(`${this.API}/user/${userId}/lojas`, { lojas });
  }
}
