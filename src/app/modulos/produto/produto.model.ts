import { Categoria } from '../../service/categoria.service';

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
