import { AppPermissions } from './app-permissions';

export const PermissionGroups = {

  produtos: [
    AppPermissions.Produto.read,
    AppPermissions.Produto.legacyRead,
  ],

  pedidos: [
    AppPermissions.Pedido.read,
  ],

  usuarios: [
    AppPermissions.Usuario.read,
  ],

  lojas: [
    AppPermissions.Loja.read,
  ],

  gestao: [
    AppPermissions.Produto.read,
    AppPermissions.Produto.legacyRead,
    AppPermissions.Pedido.read,
    AppPermissions.Usuario.read,
    AppPermissions.Loja.read,
    AppPermissions.Estoque.read,
  ]

} as const;