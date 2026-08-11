import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
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
  erro = '';
  carregando = false;
  currentYear = new Date().getFullYear();

  // Etapa 1 — Conta
  nome = '';
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
    private cadastroService: CadastroService,
    private cd: ChangeDetectorRef
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
      if (!this.nome.trim() || !this.email.trim() || !this.senha) {
        this.erro = 'Preencha nome, e-mail e senha.';
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

    Swal.fire({
      title: 'Criando conta...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.cadastroService.criarConta({
      nome: this.nome.trim(),
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
      next: () => {
        this.carregando = false;
        Swal.fire('Sucesso', 'Conta criada com sucesso!', 'success').then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;

        const mensagem = this.extrairMensagemErro(err);
        Swal.fire('Erro', mensagem, 'error');

        if (mensagem.toLowerCase().includes('e-mail') || mensagem.toLowerCase().includes('email') || mensagem.toLowerCase().includes('login')) {
          this.step = 1;
        }
        this.cd.detectChanges();
      }
    });
  }

  private extrairMensagemErro(err: HttpErrorResponse): string {
    // status 0 = a requisição nem chegou a ter uma resposta legível pelo navegador
    // (sem conexão, ou o backend bloqueou por CORS na resposta de erro).
    if (err.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
    }

    const corpo = err.error;

    if (corpo && typeof corpo === 'object' && typeof corpo.message === 'string') {
      return corpo.message;
    }

    // Se o backend não respondeu com Content-Type application/json, o corpo
    // chega como texto puro em vez de já vir parseado como objeto.
    if (typeof corpo === 'string' && corpo.trim()) {
      try {
        const parsed = JSON.parse(corpo);
        if (parsed?.message) return parsed.message;
      } catch {
        // corpo não é JSON, ignora e cai no fallback abaixo
      }
    }

    return 'Não foi possível criar a conta. Tente novamente.';
  }
}
