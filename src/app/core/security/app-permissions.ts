export const AppPermissions = {

  Produto: {
    read: 'PRODUTO_READ',
    create: 'PRODUTO_CREATE',
    update: 'PRODUTO_UPDATE',
    delete: 'PRODUTO_DELETE',

    legacyRead: 'PRODUCT_READ',
    legacyCreate: 'PRODUCT_CREATE',
    legacyUpdate: 'PRODUCT_UPDATE',
    legacyDelete: 'PRODUCT_DELETE',
  },

  Estoque: {
    read: 'ESTOQUE_READ',
    create: 'ESTOQUE_CREATE',
    update: 'ESTOQUE_UPDATE',
    delete: 'ESTOQUE_DELETE',
    promo: 'ESTOQUE_PROMO',
  },

  Loja: {
    read: 'LOJA_READ',
    create: 'LOJA_CREATE',
    update: 'LOJA_UPDATE',
    delete: 'LOJA_DELETE',
  },

  Pedido: {
    read: 'PEDIDO_READ',
    create: 'PEDIDO_CREATE',
    update: 'PEDIDO_UPDATE',
    delete: 'PEDIDO_DELETE',
  },

  Usuario: {
    read: 'USUARIO_READ',
    create: 'USUARIO_CREATE',
    update: 'USUARIO_UPDATE',
    delete: 'USUARIO_DELETE',
  },

  Categoria: {
    read: 'CATEGORIA_READ',
    create: 'CATEGORIA_CREATE',
    update: 'CATEGORIA_UPDATE',
    delete: 'CATEGORIA_DELETE',
  },

  Sistema: {
    permissionsRead: 'PERMISSIONS_READ',
  }

} as const;