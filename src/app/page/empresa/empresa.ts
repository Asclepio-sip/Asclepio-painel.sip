import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Empresa, EmpresaFiltro, EmpresaService, PageResponse } from '../../service/empresa.service';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './empresa.html',
  styleUrl: './empresa.css',
})
export class EmpresaComponent implements OnInit {

  private readonly empresaService = inject(EmpresaService);

  empresas: Empresa[] = [];
  carregando = false;
  salvando = false;
  excluindoId: number | null = null;

  totalEmpresas = 0;
  totalAtivas = 0;
  totalInativas = 0;

  paginaAtual = 0;
  tamanhoPagina = 10;
  totalPaginas = 0;
  totalElementos = 0;

  filtros: EmpresaFiltro & { ativaSelecionada: '' | 'true' | 'false' } = {
    nome: '',
    cnpj: '',
    ativaSelecionada: ''
  };

  form: Empresa = {
    nome: '',
    cnpj: '',
    ativa: true,
  };

  empresaEditandoId: number | null = null;

  ngOnInit(): void {
    this.carregarEmpresas();
    this.carregarResumo();
  }

  carregarEmpresas(page: number = 0): void {
    this.carregando = true;
    const filtros = this.montarFiltros();

    this.empresaService.listar(page, this.tamanhoPagina, filtros).subscribe({
      next: response => {
        this.aplicarResposta(response, page);
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        alert('Erro ao carregar empresas');
      }
    });
  }

  aplicarFiltros(): void {
    this.carregarEmpresas(0);
  }

  limparFiltros(): void {
    this.filtros = {
      nome: '',
      cnpj: '',
      ativaSelecionada: ''
    };

    this.carregarEmpresas(0);
  }

  carregarResumo(): void {
    forkJoin({
      total: this.empresaService.listar(0, 1),
      ativas: this.empresaService.listar(0, 1, { ativa: true }),
      inativas: this.empresaService.listar(0, 1, { ativa: false }),
    }).subscribe({
      next: ({ total, ativas, inativas }) => {
        this.totalEmpresas = this.obterTotalElementos(total);
        this.totalAtivas = this.obterTotalElementos(ativas);
        this.totalInativas = this.obterTotalElementos(inativas);
      },
      error: () => {
        this.totalEmpresas = this.empresas.length;
        this.totalAtivas = this.empresas.filter(empresa => empresa.ativa).length;
        this.totalInativas = this.empresas.filter(empresa => !empresa.ativa).length;
      }
    });
  }

  novaEmpresa(): void {
    this.empresaEditandoId = null;
    this.form = {
      nome: '',
      cnpj: '',
      ativa: true,
    };
  }

  editar(empresa: Empresa): void {
    this.empresaEditandoId = empresa.id ?? null;
    this.form = {
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      ativa: empresa.ativa,
    };
  }

  salvar(): void {
    if (!this.form.nome.trim() || !this.form.cnpj.trim()) {
      alert('Informe nome e CNPJ da empresa');
      return;
    }

    this.salvando = true;
    const requisicao = this.empresaEditandoId !== null
      ? this.empresaService.atualizar(this.empresaEditandoId, this.form)
      : this.empresaService.criar(this.form);

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.novaEmpresa();
        this.carregarEmpresas(this.paginaAtual);
      },
      error: () => {
        this.salvando = false;
        alert('Erro ao salvar empresa');
      }
    });
  }

  cancelarEdicao(): void {
    this.novaEmpresa();
  }

  excluir(empresa: Empresa): void {
    if (!empresa.id) {
      return;
    }

    const confirmou = confirm(`Excluir a empresa ${empresa.nome}?`);
    if (!confirmou) {
      return;
    }

    this.excluindoId = empresa.id;

    this.empresaService.deletar(empresa.id).subscribe({
      next: () => {
        this.excluindoId = null;
        if (this.empresaEditandoId === empresa.id) {
          this.novaEmpresa();
        }

        this.carregarEmpresas(this.paginaAtual);
      },
      error: () => {
        this.excluindoId = null;
        alert('Erro ao excluir empresa');
      }
    });
  }

  paginaAnterior(): void {
    if (this.paginaAtual > 0) {
      this.carregarEmpresas(this.paginaAtual - 1);
    }
  }

  proximaPagina(): void {
    if (this.paginaAtual < this.totalPaginas - 1) {
      this.carregarEmpresas(this.paginaAtual + 1);
    }
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.carregarEmpresas(pagina);
    }
  }

  get estaEditando(): boolean {
    return this.empresaEditandoId !== null;
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, index) => index);
  }

  private montarFiltros(): EmpresaFiltro {
    const filtros: EmpresaFiltro = {
      nome: this.filtros.nome?.trim() || undefined,
      cnpj: this.filtros.cnpj?.trim() || undefined,
    };

    if (this.filtros.ativaSelecionada !== '') {
      filtros.ativa = this.filtros.ativaSelecionada === 'true';
    }

    return filtros;
  }

  private aplicarResposta(response: PageResponse<Empresa>, page: number): void {
    this.empresas = response.content ?? [];
    this.paginaAtual = response.page?.number ?? response.number ?? page;
    this.totalPaginas = response.page?.totalPages ?? response.totalPages ?? 0;
    this.totalElementos = response.page?.totalElements ?? response.totalElements ?? this.empresas.length;

    if (this.paginaAtual === 0 && !this.filtros.nome && !this.filtros.cnpj && this.filtros.ativaSelecionada === '') {
      this.totalEmpresas = this.totalElementos;
      this.totalAtivas = this.empresas.filter(empresa => empresa.ativa).length;
      this.totalInativas = this.empresas.filter(empresa => !empresa.ativa).length;
    }
  }

  private obterTotalElementos(response: PageResponse<Empresa>): number {
    return response.page?.totalElements ?? response.totalElements ?? response.content?.length ?? 0;
  }
}