import { AppPermissions } from './app-permissions';

export const PermissionGroups = {

  produtos: [
    AppPermissions.Produto.read,
  ],

  estoque: [
    AppPermissions.Estoque.read,
  ],

  pedidos: [
    AppPermissions.Pedido.read,
  ],

  usuarios: [
    AppPermissions.Usuario.read,
    AppPermissions.User.read,
  ],

  lojas: [
    AppPermissions.Loja.read,
  ],

  categorias: [
    AppPermissions.Categoria.read,
  ],

  bairros: [
    AppPermissions.Bairro.read,
  ],

  lojaBairros: [
    AppPermissions.LojaBairro.read,
  ],

  roles: [
    AppPermissions.Sistema.roleRead,
  ],

  permissoes: [
    AppPermissions.Sistema.permissionsRead,
  ],

  gestao: [
    AppPermissions.Produto.read,
    AppPermissions.Estoque.read,
    AppPermissions.Pedido.read,
    AppPermissions.Usuario.read,
    AppPermissions.User.read,
    AppPermissions.Loja.read,
    AppPermissions.Categoria.read,
    AppPermissions.Bairro.read,
    AppPermissions.LojaBairro.read,
    AppPermissions.Sistema.permissionsRead,
    AppPermissions.Sistema.roleRead,
  ]

} as const;