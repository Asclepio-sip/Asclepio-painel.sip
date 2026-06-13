import { Component } from '@angular/core';
import { NavbarAdministradorComponent } from "../../shared/navbar-administrador/navbar-administrador";
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ProductService } from '../../service/product.service';
import { RouterModule } from '@angular/router';
import { ListaDeLoja } from "./lista-de-loja/lista-de-loja";

@Component({
  selector: 'app-gestao-de-loja',
  imports: [NavbarAdministradorComponent, SidebarComponent, RouterModule, ListaDeLoja],
  templateUrl: './gestao-de-loja.html',
  styleUrl: './gestao-de-loja.css',
})
export class GestaoDeLoja {


  // 🔹 FORM PRODUTO
  name = '';
  valor!: number;
  desconto = 0;
  imagemUrl = '';
  categoriaId!: number;
  temEmEstoque = true;

  // 🔹 CONTROLE MODAIS
  showProductModal = false;
  showCategoryModal = false;

  constructor(private productService: ProductService) {}


  
  // 🔥 MODAL PRODUTO
  openProductModal() {
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
  }

  // 🔥 MODAL CATEGORIA
  openCategoryModal() {
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
  }

  // 🔍 PESQUISA
  onSearch(value: string) {
    this.productService.setSearch(value);
  }

  
}
