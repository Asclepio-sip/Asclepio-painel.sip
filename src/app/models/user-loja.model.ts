export interface Permission {
  id: string;
  nome: string;
  descricao: string;
}

export interface Role {
  id: string;
  nome: string;
  descricao: string;
  permissions: Permission[];
}

export interface UserLoja {
  id: string;
  user: {
    id: string;
    login: string;
    email?: string;
  };
  loja: {
    id: number;
    nomeLoja: string;
  };
  role: Role;
}

/** Item de GET /user/{id}/lojas — só lojas da empresa atual. */
export interface LojaDoUsuario {
  lojaId: number;
  lojaNome: string;
  roleId: string;
  roleNome: string;
}
