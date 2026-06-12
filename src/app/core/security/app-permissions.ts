export const AppPermissions = {

  Produto: {
    read: 'VerProduto',
    create: 'CriarProduto',
    update: 'EditarProduto',
    delete: 'ExcluirProduto',
  },

  Estoque: {
    read: 'VerEstoque',
    create: 'CriarEstoque',
    update: 'EditarEstoque',
    delete: 'ExcluirEstoque',
    promo: 'PromocaoEstoque',
  },

  Loja: {
    read: 'VerLoja',
    create: 'CriarLoja',
    update: 'EditarLoja',
    delete: 'ExcluirLoja',
  },

  Bairro: {
    read: 'VerBairro',
    create: 'CriarBairro',
    update: 'EditarBairro',
    delete: 'ExcluirBairro',
  },

  LojaBairro: {
    read: 'VerLojaBairro',
    create: 'CriarLojaBairro',
    update: 'EditarLojaBairro',
    delete: 'ExcluirLojaBairro',
  },

  Pedido: {
    read: 'VerPedido',
    create: 'CriarPedido',
    update: 'EditarPedido',
    delete: 'ExcluirPedido',
  },

  Usuario: {
    read: 'VerUsuario',
    create: 'CriarUsuario',
    update: 'EditarUsuario',
    delete: 'ExcluirUsuario',
  },

  Categoria: {
    read: 'VerCategoria',
    create: 'CriarCategoria',
    update: 'EditarCategoria',
    delete: 'ExcluirCategoria',
  },

  User: {
    read: 'VerUser',
    create: 'CriarUser',
    update: 'EditarUser',
    delete: 'ExcluirUser',
  },

  Sistema: {
    permissionsRead: 'VerPermissoes',
    roleRead: 'VerRole',
  }

} as const;