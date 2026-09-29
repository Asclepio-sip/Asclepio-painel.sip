import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LojaService } from '../../../service/loja/loja.service';

@Component({
  selector: 'app-tela-de-add-loja',
  standalone: true,
  templateUrl: './tela-de-add-loja.html',
  styleUrl: './tela-de-add-loja.css',
  imports: [CommonModule, FormsModule]
})
export class TelaDeAddLoja {

  nomeLoja = '';
  cep = '';
  cnpj = '';
  telefone = '';
  textoDescricao = '';
  tipoAtendimento = '';
  valorMinimoFreteGratis: number | null = null;

  constructor(
    private lojaService: LojaService,
    private router: Router
  ) {}

  // Na tela o campo aparece formatado; no JSON vai só com dígitos (ver somenteDigitos em salvar()).
  // Só dígitos, limitados ao tamanho do campo, já formatados enquanto digita.
  // Usa (input) + [value] em vez de ngModel: se a máscara devolver o mesmo valor
  // (ex.: digitou uma letra), o ngModel não reescreveria o input.
  onInputNumerico(event: Event, campo: 'telefone' | 'cep' | 'cnpj') {
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, TelaDeAddLoja.LIMITE_DIGITOS[campo]);
    const formatado = TelaDeAddLoja.MASCARAS[campo](digitos);

    input.value = formatado;
    this[campo] = formatado;
  }

  private static readonly LIMITE_DIGITOS = { telefone: 11, cep: 8, cnpj: 14 };

  private static readonly MASCARAS: Record<'telefone' | 'cep' | 'cnpj', (d: string) => string> = {
    telefone: d => {
      if (d.length <= 2) return d.length ? `(${d}` : '';
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
    },
    cep: d => d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`,
    cnpj: d => d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2'),
  };

  private somenteDigitos(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  private qtdDigitos(valor: string): number {
    return this.somenteDigitos(valor).length;
  }

  salvar() {

    const digitosTelefone = this.qtdDigitos(this.telefone);
    if (digitosTelefone < 10) {
      alert('Telefone incompleto: informe o DDD e o número (10 ou 11 dígitos).');
      return;
    }

    if (this.cep && this.qtdDigitos(this.cep) !== 8) {
      alert('CEP incompleto: o CEP tem 8 dígitos.');
      return;
    }

    if (this.cnpj && this.qtdDigitos(this.cnpj) !== 14) {
      alert('CNPJ incompleto: o CNPJ tem 14 dígitos.');
      return;
    }

    const novaLoja = {

      nomeLoja: this.nomeLoja,

      cep: this.somenteDigitos(this.cep),

      cnpj: this.somenteDigitos(this.cnpj) || null,

      telefone: this.somenteDigitos(this.telefone),

      textoDescricao: this.textoDescricao || null,

      tipoAtendimento: this.tipoAtendimento,

      valorMinimoFreteGratis:
        this.valorMinimoFreteGratis ?? 0
    };

    this.lojaService.criar(novaLoja).subscribe({

      next: () => {

        alert('Loja criada com sucesso!');

        this.router.navigate(['/lojas']);
      },

      error: (err) => {

        console.error(err);

        alert('Erro ao criar loja');
      }
    });
  }

  cancelar() {
    this.router.navigate(['/pedidos']);
  }
}
