import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Categoria } from './categoria.service';

/* =========================
   DTOs (BACKEND MAPPED)
========================= */

export interface Product {
  id: number;
  name: string;
  imagemUrl?: string;
  imagemBase64: string;
  categoria?: Categoria;
  variacoes: ProdutoVariacao[];
  categoriaId?: number;
  nomeCategoria?: string | null;
  categoriaNome?: string;
}

export interface ProdutoAddDTO {
  nome: string;
  descricao?: string;
  marca?: string;
  categoriaId: number;
  imagem: File;
}

export interface ProdutoUpdateDTO {
  name?: string;
  imagemBase64?: string;
  categoriaNome?: string;
}

export interface ProdutoVariacao {
  id: number;
  nomeVariacao: string;
  codigoBarras?: string;
  ativo: boolean;
}

export interface ProdutoVariacaoRequest {
  nomeVariacao: string;
  codigoBarras?: string;
  ativo?: boolean;
}

export interface ProdutoVitrine {
  name: string;
  variacoes: ProdutoVariacao[];
}

export interface ProdutoFiltro {
  nome?: string;
  variacao?: string;
  categoriaId?: number | null;
  nomeCategoria?: string;
}

export interface PageResponse<T> {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  size?: number;
  number?: number;
  totalElements?: number;
  totalPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  /* =========================
     APIs
  ========================= */

  private API =
    `${environment.apiUrl}/products`;

  private VARIACOES_API =
    `${environment.apiUrl}/produtos`;


  totalPages = 0;
  totalElements = 0;

  private productsSubject =
    new BehaviorSubject<Product[]>([]);

  private searchSubject =
    new BehaviorSubject<string>('');

  products$ = combineLatest([
    this.productsSubject,
    this.searchSubject
  ]).pipe(
    map(([products, search]) =>
      products.filter(p =>
        p.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      )
    )
  );

  vitrine$ = this.products$.pipe(
    map(produtos =>
      this.groupByName(produtos)
    )
  );

  constructor(
    private http: HttpClient
  ) {}

  /* =========================
     LOAD ADMIN
  ========================= */

  loadProducts(
    page: number = 0,
    size: number = 20,
    filtro: ProdutoFiltro = {}
  ) {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    params = this.adicionarParametro(params, 'nome', filtro.nome);
    params = this.adicionarParametro(params, 'variacao', filtro.variacao);
    params = this.adicionarParametro(params, 'categoriaId', filtro.categoriaId);
    params = this.adicionarParametro(params, 'nomeCategoria', filtro.nomeCategoria);

    return this.http.get<
      PageResponse<Product>
    >(
      this.API,
      { params }
    ).pipe(
      map(response => ({
        ...response,
        content: response.content.map(produto => this.normalizarProduto(produto))
      }))
    );
  }

  /* =========================
     CREATE
  ========================= */

  addProduct(product: ProdutoAddDTO) {
    const formData = new FormData();
    formData.append('nome', product.nome);
    formData.append('descricao', product.descricao || '');
    formData.append('marca', product.marca || '');
    formData.append('categoriaId', product.categoriaId.toString());
    formData.append('imagem', product.imagem);

    return this.http.post<Product>(
      this.API,
      formData
    );
  }

  buscarPorId(id: number) {
    return this.loadProducts(0, 1000).pipe(
      map(response => {
        const produto = response.content.find(p => p.id === id);

        if (!produto) {
          throw new Error(`Produto ${id} nao encontrado na listagem.`);
        }

        return produto;
      })
    );
  }

  addVariacao(
    produtoId: number,
    variacao: ProdutoVariacaoRequest
  ) {
    return this.http.post<ProdutoVariacao>(
      `${environment.apiUrl}/variacoes/produtos/${produtoId}`,
      variacao
    ).pipe(
      map(response => this.normalizarVariacao(response))
    );
  }

  listarVariacoes(produtoId: number) {
    const params = new HttpParams()
      .set('produtoId', produtoId)
      .set('page', 0)
      .set('size', 20);

    return this.http.get<ProdutoVariacao[] | PageResponse<ProdutoVariacao>>(
      `${environment.apiUrl}/variacoes`,
      { params }
    ).pipe(
      map(response => {
        const variacoes = Array.isArray(response)
          ? response
          : response.content ?? [];

        return variacoes.map(variacao => this.normalizarVariacao(variacao));
      })
    );
  }

  atualizarVariacao(
    produtoId: number,
    variacaoId: number,
    variacao: ProdutoVariacaoRequest
  ) {
    return this.http.put<ProdutoVariacao>(
      `${environment.apiUrl}/variacoes/produtos/${produtoId}/${variacaoId}`,
      variacao
    ).pipe(
      map(response => this.normalizarVariacao(response))
    );
  }

  deletarVariacao(
    produtoId: number,
    variacaoId: number
  ) {
    return this.http.delete(
      `${environment.apiUrl}/variacoes/produtos/${produtoId}/${variacaoId}`
    );
  }

  /* =========================
     UPDATE
  ========================= */

  updateProduct(
    id: number,
    product: ProdutoUpdateDTO
  ) {

    return this.http.patch(
      `${this.API}/${id}`,
      product
    );
  }

  /* =========================
     DELETE
  ========================= */

  deleteProduct(
    id: number
  ) {

    return this.http.delete(
      `${this.API}/${id}`
    )
    .subscribe(() => {

      this.loadProducts();

    });
  }

  /* =========================
     SEARCH
  ========================= */

  setSearch(
    term: string
  ) {

    this.searchSubject
      .next(term);
  }

  /* =========================
     GROUP VITRINE
  ========================= */

  groupByName(produtos: Product[]): ProdutoVitrine[] {
    return produtos.map(produto => ({
      name: produto.name,
      variacoes: produto.variacoes ?? []
    }));
  }



  getCategorias() {

    return this.http.get<
      any
    >(
      `${environment.apiUrl}/categorias`
    ).pipe(
      map(response => {
        const categorias = Array.isArray(response) ? response : response.content || [];
        return categorias
          .filter((cat: Categoria) => !cat.categoriaPaiId)
          .map((categoria: Categoria) => categoria.nomeCategoria)
          .filter((nome: string) => !!nome);
      })
    );
  }

  getCategoriasComId() {

    return this.http.get<
      any
    >(
      `${environment.apiUrl}/categorias`
    ).pipe(
      map(response => {
        const categorias = Array.isArray(response) ? response : response.content || [];
        return categorias.filter((cat: Categoria) => !cat.categoriaPaiId);
      })
    );
  }

  private adicionarParametro(
    params: HttpParams,
    chave: string,
    valor: string | number | null | undefined
  ) {
    if (valor === null || valor === undefined || valor === '') {
      return params;
    }

    return params.set(chave, String(valor));
  }

  private normalizarProduto(produto: any): Product {
    const imagemBase64 = produto.imagemBase64 ?? '';

    return {
      ...produto,
      name: produto.name ?? produto.nomeProduto ?? produto.nome ?? '',
      imagemUrl:
        produto.imagemUrl ??
        produto.imageUrl ??
        (imagemBase64 ? `data:image/png;base64,${imagemBase64}` : ''),
      imagemBase64,
      categoriaNome:
        produto.categoriaNome ??
        produto.nomeCategoria ??
        produto.categoria?.nomeCategoria ??
        '',
      variacoes: (produto.variacoes ?? []).map((variacao: any) =>
        this.normalizarVariacao(variacao)
      )
    };
  }

  private normalizarVariacao(variacao: any): ProdutoVariacao {
    return {
      ...variacao,
      id: variacao.id,
      nomeVariacao:
        variacao.nomeVariacao ??
        variacao.nome ??
        variacao.variacao ??
        '',
      codigoBarras:
        variacao.codigoBarras ??
        variacao.codigoBarra ??
        variacao.codigo ??
        undefined,
      ativo: variacao.ativo ?? true
    };
  }
}
