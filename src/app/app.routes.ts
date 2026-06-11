import { Routes } from '@angular/router';
import { LoginComponent } from './page/login/login.component';
import { ProductListComponent } from './page/paginas_adm/product/product-list.component';
import { authGuard } from './core/guards/auth-guard';
import { TelaInicial } from './page/TelaClientes/tela-inicial/tela-inicial';
import { adminGuard } from './core/guards/admin.guard';
import { AdminUsersComponent } from './page/paginas_adm/admin-users/admin-users';
import { publicGuard } from './core/public.guard';
import { TelaDeAddProduto } from './page/paginas_adm/product/tela-de-add-produto/tela-de-add-produto';
import { CestaDeCompras } from './page/TelaClientes/fazerPedido/cesta-de-compras/cesta-de-compras';
import { DadoClientes } from './page/TelaClientes/fazerPedido/dado-clientes/dado-clientes';
import { AddEditCartegoria } from './page/paginas_adm/product/add-edit-cartegoria/add-edit-cartegoria';
import { FinalizarPedido } from './page/TelaClientes/fazerPedido/finalizar-pedido/finalizar-pedido';
import { Pedidos } from './page/paginas_adm/pedidos/pedidos';
import { DetalhePedido } from './page/paginas_adm/detalhe-pedido/detalhe-pedido';
import { GestaoDeLoja } from './page/paginas_adm/gestao-de-loja/gestao-de-loja';
import { TelaDeAddLoja } from './page/paginas_adm/gestao-de-loja/tela-de-add-loja/tela-de-add-loja';
import { EditarLoja } from './page/paginas_adm/gestao-de-loja/editar-loja/editar-loja';
import { AddFuncionarioLoja } from './page/paginas_adm/gestao-de-loja/add-funcionario-loja/add-funcionario-loja';
import { AddProdutoEstoqueLoja } from './page/paginas_adm/product/add-produto-estoque-loja/add-produto-estoque-loja';
import { AddBairro } from './page/paginas_adm/gestao-de-loja/add-bairro/add-bairro';
import { RelacionarBairroLoja } from './page/paginas_adm/gestao-de-loja/relacionar-bairro-loja/relacionar-bairro-loja';
import { PermissionGroups } from './core/security/permission-groups';
export const routes: Routes = [
  { path: '', component: TelaInicial , canActivate: [publicGuard] },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'cestar', component: CestaDeCompras, canActivate:[publicGuard]},
  { path: 'dados', component: DadoClientes, canActivate:[publicGuard]},
  { path: 'finalizar-pedido', component: FinalizarPedido, canActivate:[publicGuard]},



  { path: 'pedido', component: Pedidos, canActivate: [authGuard] },
  { path: 'loja', component: GestaoDeLoja, canActivate: [authGuard] },
  { path: 'addloja', component: TelaDeAddLoja, canActivate: [authGuard] },
  { path: 'editar-loja/:id', component: EditarLoja, canActivate: [authGuard] },
  { path: 'addloja/:id/funcionarios', component: AddFuncionarioLoja, canActivate: [authGuard] },
  { path: 'pedidos/:id',loadComponent: () =>import('./page/paginas_adm/detalhe-pedido/detalhe-pedido').then(m => m.DetalhePedido), canActivate: [authGuard] },
  { path: 'products', component: ProductListComponent, canActivate: [authGuard] },
  { path: 'AddUsuario', component: AdminUsersComponent, canActivate: [adminGuard], data: { permissions: PermissionGroups.usuarios } },
  { path: 'addProduto', component: TelaDeAddProduto, canActivate: [adminGuard], data: { permissions: PermissionGroups.produtos }},
  { path: 'addestoque', component: AddProdutoEstoqueLoja, canActivate: [authGuard]},
  { path: 'addCategoria', component: AddEditCartegoria, canActivate: [adminGuard], data: { permissions: PermissionGroups.produtos }},
  { path: 'add-bairro', component: AddBairro, canActivate: [adminGuard], data: { permissions: PermissionGroups.lojas }},
  {path: 'loja/:id/bairros',loadComponent: () =>import('./page/paginas_adm/gestao-de-loja/relacionar-bairro-loja/relacionar-bairro-loja').then(m => m.RelacionarBairroLoja),canActivate: [authGuard]},
  { path: '**', redirectTo: '' }
];
