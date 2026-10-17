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

/** Quanto do limite já foi usado. limite null = sem limite. */
export interface UsoLimite {
  usado: number;
  limite: number | null;
  /** true quando não dá para cadastrar mais. */
  atingido: boolean;
}

/**
 * Plano da empresa logada (GET /planos/atual). Os limites valem no backend: criar loja/usuário/cliente
 * além do plano devolve 400 com a mensagem. Aqui é só para mostrar e desligar os botões.
 */
export interface PlanoEmpresa {
  /** null = empresa sem plano (sem limites). */
  plano: string | null;
  lojas: UsoLimite;
  funcionarios: UsoLimite;
  cadastroClientes: boolean;
}
