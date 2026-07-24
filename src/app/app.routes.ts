import { Routes } from '@angular/router';
import { LoginComponent } from './page/login/login.component';
import { ProductListComponent } from './page/product/product-list.component';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin.guard';
import { AdminUsersComponent } from './page/criar-users/admin-users';
import { publicGuard } from './core/public.guard';
import { TelaDeAddProduto } from './page/product/tela-de-add-produto/tela-de-add-produto';
import { AddEditCartegoria } from './page/add-edit-cartegoria/add-edit-cartegoria';
import { Pedidos } from './page/pedidos/pedidos';
import { FazerPedido } from './page/pedidos/fazer-pedido/fazer-pedido';
import { DetalhePedido } from './page/detalhe-pedido/detalhe-pedido';
import { GestaoDeLoja } from './page/gestao-de-loja/gestao-de-loja';
import { TelaDeAddLoja } from './page/gestao-de-loja/tela-de-add-loja/tela-de-add-loja';
import { EditarLoja } from './page/gestao-de-loja/editar-loja/editar-loja';
import { AddFuncionarioLoja } from './page/gestao-de-loja/add-funcionario-loja/add-funcionario-loja';
import { AddProdutoEstoqueLoja } from './page/estoque/add-produto-estoque-loja/add-produto-estoque-loja';
import { RelatorioEstoque } from './page/estoque/relatorio-estoque/relatorio-estoque';
import { AtualizarEstoque } from './page/estoque/atualizar-estoque/atualizar-estoque';
import { AddBairro } from './page/gestao-de-loja/add-bairro/add-bairro';
import { RelacionarBairroLoja } from './page/gestao-de-loja/relacionar-bairro-loja/relacionar-bairro-loja';
import { PermissionGroups } from './core/security/permission-groups';
import { LandingComponent } from './page/landing/landing';
import { CadastroComponent } from './page/cadastro/cadastro';
export const routes: Routes = [

  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'landing', component: LandingComponent, canActivate: [publicGuard] },
  { path: 'cadastro', component: CadastroComponent, canActivate: [publicGuard] },



  { path: 'pedido', component: Pedidos, canActivate: [authGuard] },
  { path: 'fazer-pedido', component: FazerPedido, canActivate: [adminGuard], data: { permissions: PermissionGroups.pedidos } },
  { path: 'loja', component: GestaoDeLoja, canActivate: [authGuard] },
  { path: 'addloja', component: TelaDeAddLoja, canActivate: [authGuard] },
  { path: 'editar-loja/:id', component: EditarLoja, canActivate: [authGuard] },
  { path: 'addloja/:id/funcionarios', component: AddFuncionarioLoja, canActivate: [authGuard] },
  { path: 'pedidos/:id',loadComponent: () =>import('./page/detalhe-pedido/detalhe-pedido').then(m => m.DetalhePedido), canActivate: [authGuard] },
  { path: 'products', component: ProductListComponent, canActivate: [authGuard] },
  { path: 'variacoes', loadComponent: () => import('./page/product/variacoes-lista/variacoes-lista').then(m => m.VariacoesLista), canActivate: [adminGuard], data: { permissions: PermissionGroups.produtos }},
  { path: 'products/:id/variacoes', loadComponent: () => import('./page/product/produto-variacoes/produto-variacoes').then(m => m.ProdutoVariacoes), canActivate: [adminGuard], data: { permissions: PermissionGroups.produtos }},
  { path: 'AddUsuario', component: AdminUsersComponent, canActivate: [adminGuard], data: { permissions: PermissionGroups.usuarios } },
  { path: 'addProduto', component: TelaDeAddProduto, canActivate: [adminGuard], data: { permissions: PermissionGroups.produtos }},
  { path: 'addestoque', component: AddProdutoEstoqueLoja, canActivate: [adminGuard], data: { permissions: PermissionGroups.estoque }},
  { path: 'atualizar-estoque', component: AtualizarEstoque, canActivate: [adminGuard], data: { permissions: PermissionGroups.estoque }},
  { path: 'relatorio-estoque', component: RelatorioEstoque, canActivate: [adminGuard], data: { permissions: PermissionGroups.estoque }},
  { path: 'addCategoria', component: AddEditCartegoria, canActivate: [adminGuard], data: { permissions: PermissionGroups.produtos }},
  { path: 'add-bairro', component: AddBairro, canActivate: [adminGuard], data: { permissions: PermissionGroups.lojas }},
  {path: 'loja/:id/bairros',loadComponent: () =>import('./page/gestao-de-loja/relacionar-bairro-loja/relacionar-bairro-loja').then(m => m.RelacionarBairroLoja),canActivate: [authGuard]},
  { path: '**', redirectTo: 'login' }
];
