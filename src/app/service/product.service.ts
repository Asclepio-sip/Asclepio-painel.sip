import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/* =========================
   DTOs (BACKEND MAPPED)
========================= */

export interface Product {
  id: number;
  name: string;
  variacao: string;
  imagemBase64: string;
  categoriaNome: string;
  precoVenda: number;
}

export interface ProdutoAddDTO {
  name: string;
  variacao: string;
  imagemBase64: string;
  categoriaNome: string;
  precoVenda: number;
}

export interface ProdutoUpdateDTO {
  name?: string;
  variacao?: string;
  imagemBase64?: string;
  categoriaNome?: string;
}

export interface ProdutoVitrine {
  name: string;
  variacoes: Product[];
}

export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
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

  private API_PUBLICA =
    `${environment.apiUrl}/productsPublico`;

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
    size: number = 20
  ) {

    return this.http.get<
      PageResponse<Product>
    >(
      `${this.API}?page=${page}&size=${size}`
    );
  }

  /* =========================
     CREATE
  ========================= */

  addProduct(
    product: ProdutoAddDTO
  ) {

    return this.http.post(
      this.API,
      product
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

  groupByName(
    produtos: Product[]
  ): ProdutoVitrine[] {

    const map =
      new Map<
        string,
        Product[]
      >();

    produtos.forEach(p => {

      if (
        !map.has(p.name)
      ) {

        map.set(
          p.name,
          []
        );
      }

      map.get(p.name)!
        .push(p);
    });

    return Array.from(
      map.entries()
    ).map(
      ([name, variacoes]) => ({

        name,
        variacoes

      })
    );
  }

  /* =========================
     API PÚBLICA
  ========================= */

  loadPublicProducts() {

    this.http
      .get<PageResponse<any>>(
        this.API
      )
      .pipe(

        map(response =>

          response.content.map(
            p => ({

              id: p.id,
              name:
                p.nomeProduto,

              variacao:
                p.variacao,

              imagemBase64:
                p.imagemUrl,

              categoriaNome:
                p.categoriaNome
                || '',

              precoVenda:
                p.precoVenda

            })
          )
        )
      )
      .subscribe(products => {

        this.productsSubject
          .next(products);

        console.log(
          'Produtos carregados:',
          products
        );
      });
  }

  getCategorias() {

    return this.http.get<
      string[]
    >(
      `${this.API_PUBLICA}/categorias`
    );
  }
}