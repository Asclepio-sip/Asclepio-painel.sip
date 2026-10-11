/** Linha da comparação de planos (ex.: "Número de Lojas" / incluído / "Até 3"). */
export interface RecursoPlano {
  nome: string;
  incluido: boolean;
  /** Texto opcional no lugar do ✓ (ex.: "Até 5", "Ilimitado"). */
  detalhe: string;
}

/** Plano de assinatura (GET /planos — público; cadastrado pelo painel SaaS). */
export interface Plano {
  id: number;
  nome: string;
  descricao: string;
  /** Preço mensal em reais. */
  preco: number;
  maisPopular: boolean;
  /** Na ordem da tabela de comparação. */
  recursos: RecursoPlano[];
}
