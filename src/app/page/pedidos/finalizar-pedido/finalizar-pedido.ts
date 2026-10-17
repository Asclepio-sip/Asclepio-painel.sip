import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CartItem, CartService } from '../../../service/cart.service';
import { CriarPedidoBalcaoRequest, PedidosService } from '../../../service/pedidos.service';
import { FormaPagamento, FormaPagamentoService, getFormaPagamentoLabel } from '../../../service/loja/forma-pagamento.service';
import { Cliente, ClienteService } from '../../../service/cliente.service';

type ModoCliente = 'selecionar' | 'novo' | 'anonimo';

const CLIENTE_ANONIMO = {
  nome: 'Anônimo',
  numero: '00000000000',
  email: 'anonimo@anonimo.com'
};

@Component({
  selector: 'app-finalizar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finalizar-pedido.html',
  styleUrl: './finalizar-pedido.css',
})
export class FinalizarPedido implements OnInit, OnDestroy {

  itens: CartItem[] = [];
  lojaId: number | null = null;

  modoCliente: ModoCliente = 'selecionar';

  clientes: Cliente[] = [];
  carregandoClientes = false;
  clienteSelecionadoId = '';
  termoBuscaCliente = '';

  novoCliente: Cliente = { nome: '', numero: '', email: '' };

  formasDePagamento: { value: string; label: string }[] = [];
  formaDePagamento = '';
  carregandoFormasDePagamento = false;

  finalizando = false;

  private cartSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private pedidosService: PedidosService,
    private formaPagamentoService: FormaPagamentoService,
    private clienteService: ClienteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {

    this.itens = this.cartService.getItems();

    if (this.itens.length === 0) {
      this.router.navigate(['/fazer-pedido']);
      return;
    }

    this.lojaId = this.itens[0].lojaId;

    this.carregarFormasDePagamento(this.lojaId);
    this.carregarClientes();

    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.itens = items;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
  }

  totalValor(): number {
    return this.itens.reduce(
      (total, item) => total + item.valorFinal * item.quantidade,
      0
    );
  }

  selecionarModoCliente(modo: ModoCliente) {
    this.modoCliente = modo;
  }

  // ── Telefone: a tela mostra "(81) 9 9999-9999", o backend recebe só os dígitos ──

  digitarTelefone(campo: HTMLInputElement) {
    const digitos = campo.value.replace(/\D/g, '').slice(0, 11);
    this.novoCliente.numero = digitos;
    // Reescreve o campo na hora: sem isso, letras e dígitos a mais ficam visíveis
    campo.value = this.formatarTelefone(digitos);
  }

  formatarTelefone(numero: string | null | undefined): string {
    const d = (numero ?? '').replace(/\D/g, '');
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }

  get clientesFiltrados(): Cliente[] {

    const termo = this.termoBuscaCliente.trim().toLowerCase();

    if (!termo) return this.clientes;

    // Busca por número ignora a máscara: "(81) 9 99" acha "8199..."
    const termoDigitos = termo.replace(/\D/g, '');

    return this.clientes.filter(c =>
      c.nome?.toLowerCase().includes(termo) ||
      (termoDigitos.length > 0 && c.numero?.replace(/\D/g, '').includes(termoDigitos)) ||
      c.email?.toLowerCase().includes(termo)
    );
  }

  carregarClientes() {

    this.carregandoClientes = true;

    this.clienteService.listar({ size: 1000 }).subscribe({

      next: (resposta) => {
        this.clientes = resposta.content;
        this.carregandoClientes = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Erro ao carregar clientes', err);
        this.carregandoClientes = false;
        this.cdr.detectChanges();
      }
    });
  }

  carregarFormasDePagamento(lojaId: number) {

    this.carregandoFormasDePagamento = true;

    this.formaPagamentoService.listarPorLoja(lojaId).subscribe({

      next: (dados: FormaPagamento[]) => {

        this.formasDePagamento = dados
          .filter(f => f.ativo)
          .map(f => ({ value: f.formaPagamento, label: getFormaPagamentoLabel(f) }));

        this.formaDePagamento = this.formasDePagamento[0]?.value ?? '';

        this.carregandoFormasDePagamento = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Erro ao carregar formas de pagamento da loja', err);
        this.formasDePagamento = [];
        this.formaDePagamento = '';
        this.carregandoFormasDePagamento = false;
        this.cdr.detectChanges();
      }
    });
  }

  voltar() {
    this.router.navigate(['/fazer-pedido']);
  }

  finalizar() {

    if (!this.lojaId) return;

    if (!this.formaDePagamento) {
      Swal.fire('Atenção', 'Selecione uma forma de pagamento.', 'warning');
      return;
    }

    if (this.modoCliente === 'selecionar' && !this.clienteSelecionadoId) {
      Swal.fire('Atenção', 'Selecione um cliente ou escolha outra opção.', 'warning');
      return;
    }

    if (this.modoCliente === 'novo') {

      if (!this.novoCliente.nome.trim() || !this.novoCliente.numero.trim() || !this.novoCliente.email.trim()) {
        Swal.fire('Atenção', 'Preencha nome, número e email do cliente.', 'warning');
        return;
      }

      if (this.novoCliente.numero.length < 10) {
        Swal.fire('Atenção', 'Informe o número com DDD, ex.: (81) 9 9999-9999.', 'warning');
        return;
      }
    }

    this.finalizando = true;
    this.cdr.detectChanges();

    Swal.fire({
      title: 'Finalizando pedido...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    if (this.modoCliente === 'novo') {

      this.clienteService.criar({ ...this.novoCliente, numero: this.novoCliente.numero.replace(/\D/g, '') }).subscribe({
        next: (clienteCriado) => this.enviarPedido(clienteCriado),
        error: (err) => this.tratarErroFinalizar(err, 'Não foi possível cadastrar o cliente.')
      });

      return;
    }

    if (this.modoCliente === 'selecionar') {

      const cliente = this.clientes.find(c => c.id === this.clienteSelecionadoId);

      if (!cliente) {
        this.finalizando = false;
        this.cdr.detectChanges();
        Swal.fire('Erro', 'Cliente selecionado não encontrado.', 'error');
        return;
      }

      this.enviarPedido(cliente);
      return;
    }

    this.enviarPedido(null);
  }

  private enviarPedido(cliente: Cliente | null) {

    const dadosCliente = cliente ?? CLIENTE_ANONIMO;

    const pedido: CriarPedidoBalcaoRequest = {
      lojaId: this.lojaId!,
      nomeCliente: dadosCliente.nome,
      telefone: dadosCliente.numero,
      email: dadosCliente.email,
      clienteId: cliente?.id,
      itens: this.cartService.getPedidoItems(),
      formaDePagamento: this.formaDePagamento
    };

    this.pedidosService.criarBalcao(pedido).subscribe({

      next: () => {

        this.finalizando = false;

        Swal.fire('Sucesso', 'Pedido finalizado com sucesso!', 'success').then(() => {
          this.cartService.clear();
          this.router.navigate(['/fazer-pedido']);
        });
      },

      error: (err) => this.tratarErroFinalizar(err, 'Não foi possível finalizar o pedido. Tente novamente.')
    });
  }

  private tratarErroFinalizar(err: unknown, mensagem: string) {
    console.error('Erro ao finalizar pedido', err);
    this.finalizando = false;
    this.cdr.detectChanges();
    Swal.fire('Erro', (err as any)?.error?.message || mensagem, 'error');
  }
}
