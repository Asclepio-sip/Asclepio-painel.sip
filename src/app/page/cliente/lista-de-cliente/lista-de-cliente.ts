import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class ListaDeCliente implements OnInit {

  clientes: Cliente[] = [];

  cliente: Cliente = this.clienteVazio();

  termoBusca = '';

  editando = false;
  carregando = false;
  salvando = false;

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  get clientesFiltrados(): Cliente[] {

    const termo = this.termoBusca.trim().toLowerCase();

    if (!termo) return this.clientes;

    return this.clientes.filter(c =>
      c.nome?.toLowerCase().includes(termo) ||
      c.numero?.toLowerCase().includes(termo) ||
      c.email?.toLowerCase().includes(termo)
    );
  }

  carregarClientes() {

    this.carregando = true;

    this.clienteService.listar().subscribe({

      next: (dados) => {

        this.clientes = [...dados];

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

      next: (clienteSalvo) => {

        if (this.editando) {
          this.clientes = this.clientes.map(
            c => c.id === clienteSalvo.id ? clienteSalvo : c
          );
        } else {
          this.clientes = [...this.clientes, clienteSalvo];
        }

        Swal.fire(
          'Sucesso',
          this.editando ? 'Cliente editado com sucesso!' : 'Cliente criado com sucesso!',
          'success'
        );

        this.salvando = false;
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

  private clienteVazio(): Cliente {
    return {
      nome: '',
      numero: '',
      email: ''
    };
  }
}
