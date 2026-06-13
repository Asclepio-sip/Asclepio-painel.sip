import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NavbarAdministradorComponent } from "../../../shared/navbar-administrador/navbar-administrador";
import { SidebarComponent } from "../../../shared/sidebar/sidebar.component";
import { EstoqueService, EstoqueRequest } from '../../../service/estoque.service';
import { ProductService, Product } from '../../../service/product.service';
import { LojaService,Loja } from '../../../service/loja/loja.service';

interface ProdutoGrupo {
  name: string;
  variacoes: ProdutoComEstoque[];
}

/**
 * NÃO estende Product com conflito de tipo opcional
 */
interface ProdutoComEstoque extends Product {
  quantidade: number;
  precoVenda: number;
}

@Component({
  selector: 'app-add-produto-estoque-loja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarAdministradorComponent,
    SidebarComponent
  ],
  templateUrl: './add-produto-estoque-loja.html',
  styleUrls: ['./add-produto-estoque-loja.css']
})
export class AddProdutoEstoqueLoja implements OnInit {

  produtosAgrupados: ProdutoGrupo[] = [];
  lojas: Loja[] = [];

  produtoSelecionado?: ProdutoGrupo;
  lojaSelecionada?: Loja;

  buscaProduto = "";

  constructor(
    private produtoService: ProductService,
    private lojaService: LojaService,
    private estoqueService: EstoqueService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarLojas();
  }

carregarProdutos() {

  this.produtoService
    .loadProducts()
    .subscribe(response => {

      const produtos = response.content;

      const mapa = new Map<string, ProdutoComEstoque[]>();

      produtos.forEach((p: Product) => {

        const produto: ProdutoComEstoque = {
          ...p,
          quantidade: 0,
          precoVenda: p.precoVenda
        };

        if (!mapa.has(p.name)) {
          mapa.set(p.name, []);
        }

        mapa.get(p.name)!.push(produto);
      });

      this.produtosAgrupados =
        Array.from(mapa.entries()).map(
          ([name, variacoes]) => ({
            name,
            variacoes
          })
        );

      this.cdr.detectChanges();
    });
}

  carregarLojas() {
    this.lojaService.listar().subscribe((lojas: Loja[]) => {
      this.lojas = lojas;
      this.cdr.detectChanges();
    });
  }

  selecionarProduto(produto: ProdutoGrupo) {
    this.produtoSelecionado = produto;
  }

  produtosFiltrados(): ProdutoGrupo[] {

    if (!this.buscaProduto) {
      return this.produtosAgrupados;
    }

    return this.produtosAgrupados.filter((p: ProdutoGrupo) =>
      p.name.toLowerCase().includes(this.buscaProduto.toLowerCase())
    );
  }

  salvar() {

    if (!this.produtoSelecionado) {
      alert("Selecione um produto");
      return;
    }

    if (!this.lojaSelecionada) {
      alert("Selecione uma loja");
      return;
    }

    this.produtoSelecionado.variacoes.forEach((v: ProdutoComEstoque) => {

      if (!v.quantidade || !v.precoVenda) return;

      const data: EstoqueRequest = {
        produtoId: v.id,
        lojaID: this.lojaSelecionada!.id!,
        nomeLoja: this.lojaSelecionada!.nomeLoja,
        nomeProduto: v.name,
        quantidade: v.quantidade,
        precoVenda: v.precoVenda
      };

      this.estoqueService.salvar(data).subscribe();
    });

    alert("Estoque cadastrado!");
  }
}
