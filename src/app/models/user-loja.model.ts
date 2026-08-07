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
