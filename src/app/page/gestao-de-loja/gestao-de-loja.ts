import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../service/product.service';
import { RouterModule } from '@angular/router';
import { ListaDeLoja } from "./lista-de-loja/lista-de-loja";
import { forkJoin } from 'rxjs';
import { LojaService, PageResponse, Loja } from '../../service/loja/loja.service';

@Component({
  selector: 'app-gestao-de-loja',
  imports: [RouterModule, ListaDeLoja],
  templateUrl: './gestao-de-loja.html',
  styleUrl: './gestao-de-loja.css',
})
export class GestaoDeLoja {

  totalLojas = 0;
  totalEntrega = 0;
  totalRetirada = 0;
  totalAmbos = 0;


  // ðŸ”¹ FORM PRODUTO
  name = '';
  valor!: number;
  desconto = 0;
  imagemUrl = '';
  categoriaId!: number;
  temEmEstoque = true;

  // ðŸ”¹ CONTROLE MODAIS
  showProductModal = false;
  showCategoryModal = false;

  constructor(
    private productService: ProductService,
    private lojaService: LojaService
  ) {}

  ngOnInit() {
    this.carregarResumoLojas();
  }


  
  // ðŸ”¥ MODAL PRODUTO
  openProductModal() {
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
  }

  // ðŸ”¥ MODAL CATEGORIA
  openCategoryModal() {
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
  }

  // ðŸ” PESQUISA
  onSearch(value: string) {
    this.productService.setSearch(value);
  }

  carregarResumoLojas() {
    forkJoin({
      total: this.lojaService.listar(0, 1),
      entrega: this.lojaService.listar(0, 1, { tipoAtendimento: 'ENTREGA' }),
      retirada: this.lojaService.listar(0, 1, { tipoAtendimento: 'RETIRADA' }),
      ambos: this.lojaService.listar(0, 1, { tipoAtendimento: 'AMBOS' }),
    }).subscribe({
      next: ({ total, entrega, retirada, ambos }) => {
        this.totalLojas = this.obterTotalElementos(total);
        this.totalEntrega = this.obterTotalElementos(entrega);
        this.totalRetirada = this.obterTotalElementos(retirada);
        this.totalAmbos = this.obterTotalElementos(ambos);
      },
      error: () => {
        this.totalLojas = 0;
        this.totalEntrega = 0;
        this.totalRetirada = 0;
        this.totalAmbos = 0;
      }
    });
  }

  private obterTotalElementos(response: PageResponse<Loja>): number {
    return response.page?.totalElements ?? response.totalElements ?? response.content?.length ?? 0;
  }

  
}
