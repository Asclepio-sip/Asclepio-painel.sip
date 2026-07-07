import { Component } from '@angular/core';
import { ProductService } from '../../service/product.service';
import { RouterModule } from '@angular/router';
import { ListaDeLoja } from "./lista-de-loja/lista-de-loja";

@Component({
  selector: 'app-gestao-de-loja',
  imports: [RouterModule, ListaDeLoja],
  templateUrl: './gestao-de-loja.html',
  styleUrl: './gestao-de-loja.css',
})
export class GestaoDeLoja {


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

  constructor(private productService: ProductService) {}


  
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

  
}
