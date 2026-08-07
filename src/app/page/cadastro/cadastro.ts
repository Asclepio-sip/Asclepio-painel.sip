import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CadastroService } from '../../service/cadastro.service';
import { FORMA_PAGAMENTO_LABELS } from '../../service/loja/forma-pagamento.service';

type Step = 1 | 2 | 3;

const FORMAS_PAGAMENTO_DISPONIVEIS = [
  'DINHEIRO',
  'PIX',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'BOLETO',
  'VALE_REFEICAO',
  'VALE_ALIMENTACAO',
  'CHEQUE',
  'OUTRO'
];

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class CadastroComponent {

  readonly formasDisponiveis = FORMAS_PAGAMENTO_DISPONIVEIS;

  step: Step = 1;
  sucesso = false;
  erro = '';
  carregando = false;
  currentYear = new Date().getFullYear();

  // Etapa 1 — Conta
  login = '';
  email = '';
  senha = '';
  confirmarSenha = '';

  // Etapa 2 — Empresa & Loja
  nomeEmpresa = '';
  nomeLoja = '';
  cep = '';
  cnpj = '';
  telefone = '';
  textoDescricao = '';
  tipoAtendimento = '';

  // Etapa 3 — Formas de pagamento
  formasPagamento: string[] = [];

  constructor(
    private router: Router,
    private cadastroService: CadastroService
  ) {}

  getFormaPagamentoLabel(forma: string): string {
    return FORMA_PAGAMENTO_LABELS[forma] ?? forma;
  }

  isFormaSelecionada(forma: string): boolean {
    return this.formasPagamento.includes(forma);
  }

  toggleFormaPagamento(forma: string) {
    this.formasPagamento = this.isFormaSelecionada(forma)
      ? this.formasPagamento.filter(f => f !== forma)
      : [...this.formasPagamento, forma];
  }

  avancar() {
    this.erro = '';

    if (this.step === 1) {
      if (!this.login.trim() || !this.email.trim() || !this.senha) {
        this.erro = 'Preencha login, e-mail e senha.';
        return;
      }
      if (this.senha !== this.confirmarSenha) {
        this.erro = 'As senhas não coincidem.';
        return;
      }
      this.step = 2;
      return;
    }

    if (this.step === 2) {
      if (!this.nomeEmpresa.trim() || !this.nomeLoja.trim() || !this.cep.trim() ||
          !this.telefone.trim() || !this.tipoAtendimento) {
        this.erro = 'Preencha os campos obrigatórios da empresa e da loja.';
        return;
      }
      this.step = 3;
    }
  }

  voltar() {
    this.erro = '';
    if (this.step > 1) {
      this.step = (this.step - 1) as Step;
    }
  }

  cadastrar() {
    this.erro = '';

    if (this.formasPagamento.length === 0) {
      this.erro = 'Selecione ao menos uma forma de pagamento.';
      return;
    }

    this.carregando = true;

    this.cadastroService.criarConta({
      login: this.login.trim(),
      password: this.senha,
      email: this.email.trim(),
      nomeEmpresa: this.nomeEmpresa.trim(),
      nomeLoja: this.nomeLoja.trim(),
      cep: this.cep.trim(),
      cnpj: this.cnpj.trim() || undefined,
      telefone: this.telefone.trim(),
      textoDescricao: this.textoDescricao.trim() || undefined,
      tipoAtendimento: this.tipoAtendimento,
      formasPagamento: this.formasPagamento
    }).subscribe({
      next: (res) => {
        sessionStorage.setItem('token', res.token);
        this.carregando = false;
        this.sucesso = true;
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;
        this.erro = this.extrairMensagemErro(err);

        const mensagem = this.erro.toLowerCase();
        if (mensagem.includes('e-mail') || mensagem.includes('email') || mensagem.includes('login')) {
          this.step = 1;
        }
      }
    });
  }

  irParaPainel() {
    this.router.navigate(['/products']);
  }

  private extrairMensagemErro(err: HttpErrorResponse): string {
    return err.error?.message || 'Não foi possível criar a conta. Tente novamente.';
  }
}
