import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Cliente, ClienteService } from '../../../service/cliente.service';

@Component({
  selector: 'app-lista-de-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './lista-de-cliente.html',
  styleUrls: ['./lista-de-cliente.css']
})
export class ListaDeCliente implements OnInit, OnDestroy {

  clientes: Cliente[] = [];

  cliente: Cliente = this.clienteVazio();

  termoBusca = '';

  editando = false;
  carregando = false;
  salvando = false;

  paginaAtual = 0;
  totalPaginas = 0;
  totalElementos = 0;
  tamanhoPagina = 20;

  private buscaTimeout: any;

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  ngOnDestroy(): void {
    clearTimeout(this.buscaTimeout);
  }

  get paginasVisiveis(): number[] {
    const janela = 5;
    const metade = Math.floor(janela / 2);
    let inicio = Math.max(0, this.paginaAtual - metade);
    const fim = Math.min(this.totalPaginas - 1, inicio + janela - 1);
    inicio = Math.max(0, fim - janela + 1);

    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  }

  carregarClientes(page: number = 0) {

    this.carregando = true;

    this.clienteService.listar({
      ...this.filtroAtual(),
      page,
      size: this.tamanhoPagina
    }).subscribe({

      next: (resposta) => {

        this.clientes = resposta.content;
        this.paginaAtual = resposta.page?.number ?? page;
        this.totalPaginas = resposta.page?.totalPages ?? 0;
        this.totalElementos = resposta.page?.totalElements ?? resposta.content.length;

        this.carregando = false;
        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);

        this.carregando = false;

        Swal.fire('Erro', 'Erro ao carregar clientes', 'error');
      }
    });
  }

  onBuscaChange() {
    clearTimeout(this.buscaTimeout);
    this.buscaTimeout = setTimeout(() => {
      this.carregarClientes(0);
    }, 400);
  }

  proximaPagina() {
    if (this.paginaAtual < this.totalPaginas - 1) {
      this.carregarClientes(this.paginaAtual + 1);
    }
  }

  paginaAnterior() {
    if (this.paginaAtual > 0) {
      this.carregarClientes(this.paginaAtual - 1);
    }
  }

  irParaPagina(pagina: number) {
    if (pagina >= 0 && pagina < this.totalPaginas && pagina !== this.paginaAtual) {
      this.carregarClientes(pagina);
    }
  }

  salvar() {

    if (!this.cliente.nome.trim()) {
      Swal.fire('Atenção', 'Digite o nome do cliente', 'warning');
      return;
    }

    if (!this.cliente.numero.trim()) {
      Swal.fire('Atenção', 'Digite o numero do cliente', 'warning');
      return;
    }

    if (!this.cliente.email.trim()) {
      Swal.fire('Atenção', 'Digite o email do cliente', 'warning');
      return;
    }

    this.salvando = true;

    const operacao = this.editando && this.cliente.id
      ? this.clienteService.atualizar(this.cliente.id, this.cliente)
      : this.clienteService.criar(this.cliente);

    operacao.subscribe({

      next: () => {

        Swal.fire(
          'Sucesso',
          this.editando ? 'Cliente editado com sucesso!' : 'Cliente criado com sucesso!',
          'success'
        );

        this.salvando = false;

        // Recarrega a pagina atual (edicao) ou volta pra primeira (cliente novo pode nao estar na pagina atual).
        this.carregarClientes(this.editando ? this.paginaAtual : 0);

        this.cancelarEdicao();
      },

      error: (err) => {

        console.error(err);

        this.salvando = false;

        Swal.fire('Erro', 'Erro ao salvar cliente', 'error');
      }
    });
  }

  editar(cliente: Cliente) {
    this.editando = true;
    this.cliente = { ...cliente };
  }

  cancelarEdicao() {
    this.editando = false;
    this.cliente = this.clienteVazio();
  }

  /**
   * Um so campo de busca, mas o back-end espera filtros separados
   * (nome / numero / email) — decide qual usar pelo formato do termo digitado.
   */
  private filtroAtual(): { nome?: string; numero?: string; email?: string } {
    const termo = this.termoBusca.trim();

    if (!termo) {
      return {};
    }

    if (termo.includes('@')) {
      return { email: termo };
    }

    if (/^[\d()\s+-]+$/.test(termo)) {
      return { numero: termo };
    }

    return { nome: termo };
  }

  private clienteVazio(): Cliente {
    return {
      nome: '',
      numero: '',
      email: ''
    };
  }
}
