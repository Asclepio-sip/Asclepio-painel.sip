# 📚 Sistema de Controle de Permissões - Documentação

## 🎯 Visão Geral

Este sistema controla automaticamente o acesso do usuário aos botões, rotas e funcionalidades baseado nas **permissões extraídas do token JWT** do backend.

Ele funciona com o padrão de autoridades usado no Spring Security: `PRODUCT_READ`, `PRODUCT_CREATE`, `PRODUCT_UPDATE`, `PRODUCT_DELETE`.

---

## 📦 Componentes Criados

### 1. **PermissionService** (`core/permission.service.ts`)
Serviço que extrai e verifica permissões do JWT

```typescript
// Injetar em componentes
constructor(private permissionService: PermissionService) {}

// Verificar permissão específica
if (this.permissionService.hasPermission('PRODUCT_CREATE')) { }

// Verificar múltiplas permissões (OU lógico)
if (this.permissionService.hasAnyPermission(['PRODUCT_UPDATE', 'PRODUCT_DELETE'])) { }

// Verificar múltiplas permissões (E lógico)
if (this.permissionService.hasAllPermissions(['PRODUCT_CREATE', 'PRODUCT_UPDATE'])) { }

// Métodos específicos de Produto
this.permissionService.canCreateProduct()  // PRODUCT_CREATE
this.permissionService.canReadProducts()   // PRODUCT_READ
this.permissionService.canUpdateProduct()  // PRODUCT_UPDATE
this.permissionService.canDeleteProduct()  // PRODUCT_DELETE
```

---

### 2. **HasPermissionDirective** (`core/has-permission.directive.ts`)
Diretiva que mostra/esconde elementos baseado em permissão

#### Uso Básico:
```html
<!-- Mostrar se tem permissão -->
<button *appHasPermission="'PRODUCT_CREATE'">
  Criar Produto
</button>

<!-- Mostrar se tem qualquer uma das permissões -->
<button *appHasPermission="['PRODUCT_UPDATE', 'PRODUCT_DELETE']; mode: 'any'">
  Editar/Deletar
</button>

<!-- Mostrar se tem TODAS as permissões -->
<button *appHasPermission="['PRODUCT_CREATE', 'PRODUCT_UPDATE']; mode: 'all'">
  Ação Super Admin
</button>
```

#### Agrupar elementos com mesma permissão:
```html
<ng-container *appHasPermission="'PRODUCT_UPDATE'">
  <button (click)="editar()">Editar</button>
  <button (click)="atualizar()">Atualizar</button>
</ng-container>
```

---

### 3. **PermissionGuard** (`core/permission.guard.ts`)
Guard de rota que protege páginas baseado em permissão

#### Uso nas Rotas:
```typescript
const routes: Routes = [
  {
    path: 'products',
    component: ProductListComponent,
    canActivate: [PermissionGuard],
    data: {
      permissions: ['PRODUCT_READ'],
      mode: 'all'  // 'all' ou 'any'
    }
  }
];
```

---

## 🔧 Como Integrar com Componentes Existentes

### Passo 1: Importar Diretiva e Serviço

```typescript
// product-list.component.ts
import { HasPermissionDirective } from '../../../core/has-permission.directive';
import { PermissionService } from '../../../core/permission.service';

@Component({
  imports: [
    CommonModule,
    RouterModule,
    HasPermissionDirective  // ✅ Adicionar aqui
  ]
})
export class ProductListComponent implements OnInit {
  constructor(
    public permissionService: PermissionService  // ✅ Adicionar aqui
  ) {}
}
```

### Passo 2: Usar no Template

```html
<!-- Mostrar botão de criar apenas se tem permissão -->
<button 
  class="btn primary" 
  *appHasPermission="'PRODUCT_CREATE'"
  [routerLink]="['/addProduto']"
>
  Novo Produto
</button>

<!-- Mostrar ações apenas se tem permissão -->
<div class="col-actions">
  <button 
    class="btn-edit"
    *appHasPermission="'PRODUCT_UPDATE'"
    (click)="editar(item)"
  >
    Editar
  </button>

  <button 
    class="btn-delete"
    *appHasPermission="'PRODUCT_DELETE'"
    (click)="deletar(item.id)"
  >
    Deletar
  </button>
</div>
```

### Passo 3: Usar Programaticamente no TypeScript

```typescript
export class ProductListComponent implements OnInit {
  constructor(public permissionService: PermissionService) {}

  ngOnInit() {
    if (this.permissionService.canCreateProduct()) {
      // Habilitar botão de criar
    }

    if (this.permissionService.canDeleteProduct()) {
      // Mostrar menu de delete
    }
  }

  deletarProduto(id: number) {
    if (!this.permissionService.hasPermission('PRODUCT_DELETE')) {
      alert('Sem permissão para deletar');
      return;
    }
    // ... executar delete
  }
}
```

---

## 🔐 Fluxo Completo

```
┌─────────────────────┐
│   Backend (Spring)  │
│   Retorna JWT com   │
│   authorities:      │
│  [PRODUCT_READ,     │
│   PRODUCT_CREATE]   │
└──────────┬──────────┘
           │
           ├─────────────────────────┐
           ↓                         ↓
┌──────────────────────┐  ┌──────────────────────┐
│  Token armazenado em │  │ AuthService          │
│  sessionStorage      │  │ decodifica JWT       │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           └──────────┬──────────────┘
                      ↓
           ┌──────────────────────────┐
           │  PermissionService       │
           │  - Extrai authorities    │
           │  - Verifica permissões   │
           └──────────┬───────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
    Diretiva    Guard de    Verificação no
    *appHas     Rotas        TypeScript
    Permission  PermissionGuard  canRead()
                                 canCreate()
                                 canDelete()
```

---

## 🌟 Permissões Padrão de Produto

| Permissão | Ação | Botão/Feature |
|-----------|------|--------------|
| `PRODUCT_READ` | Visualizar produtos | Exibir tabela e lista |
| `PRODUCT_CREATE` | Criar produto | Botão "Novo Produto" |
| `PRODUCT_UPDATE` | Editar produto | Botão "Editar", aumentar/diminuir estoque |
| `PRODUCT_DELETE` | Deletar produto | Botão "Deletar" |

---

## 📝 Exemplos Práticos

### Exemplo 1: Botão Condicionado

```html
<!-- Só aparece se tem PRODUCT_UPDATE -->
<button 
  *appHasPermission="'PRODUCT_UPDATE'"
  (click)="atualizarEstoque(produto)"
  class="btn-update"
>
  Atualizar Estoque
</button>
```

### Exemplo 2: Múltiplas Ações

```html
<!-- Só aparece se tem permissão de EDITAR OU DELETAR -->
<div *appHasPermission="['PRODUCT_UPDATE', 'PRODUCT_DELETE']; mode: 'any'">
  <button (click)="editar()">Editar</button>
  <button (click)="deletar()">Deletar</button>
</div>
```

### Exemplo 3: Menu Condicionado

```html
<select (change)="selecionarLoja($event)">
  <option value="">Todas as lojas</option>
  <option *ngFor="let l of lojas" [value]="l.id">{{l.nome}}</option>
</select>

<!-- Só mostra botão de adicionar se tem permissão -->
<button 
  *appHasPermission="'PRODUCT_CREATE'"
  [routerLink]="['/addestoque']"
  class="btn success"
>
  Novo Estoque
</button>
```

---

## 🚀 Checklist de Implementação

- [ ] Criar `PermissionService` em `core/permission.service.ts`
- [ ] Criar `HasPermissionDirective` em `core/has-permission.directive.ts`
- [ ] Criar `PermissionGuard` em `core/permission.guard.ts`
- [ ] Importar `HasPermissionDirective` nos componentes que precisam
- [ ] Injetar `PermissionService` nos componentes
- [ ] Adicionar `*appHasPermission` aos botões que requerem permissão
- [ ] Adicionar `PermissionGuard` às rotas que requerem permissão
- [ ] Testar com usuários com diferentes permissões

---

## 🔍 Debugging

### Verificar permissões no Console

```typescript
// Abrir o componente e executar no console:
const authService = ng.probe(document.body).injector.get(AuthService);
const permService = ng.probe(document.body).injector.get(PermissionService);

console.log('Token:', authService.getToken());
console.log('Permissões:', permService.getAuthorities());
console.log('Pode criar?', permService.canCreateProduct());
```

### Adicionar Logging

```typescript
// Em permission.service.ts
getAuthorities(): string[] {
  const token = this.authService.getToken();
  if (!token) return [];
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const authorities = payload.authorities || payload.permissions || [];
    console.log('Autoridades extraídas:', authorities); // Debug
    return authorities;
  } catch {
    console.error('Erro ao decodificar token');
    return [];
  }
}
```

---

## ⚠️ Pontos Importantes

1. **Permissões vêm do Backend**: O sistema extrai do JWT, então o backend DEVE retornar as authorities
2. **Função de Segurança**: Isto é validação de UI. A segurança real é no backend (não omita @PreAuthorize)
3. **Token no sessionStorage**: Atualmente armazenado em sessionStorage. Para produção, considere outras opções
4. **Modo Padrão**: Por padrão, múltiplas permissões usam AND (all). Use `mode: 'any'` para OR

---

## 📞 Suporte

Se precisar adicionar novas permissões, siga o padrão:

```typescript
// Em permission.service.ts
canDeleteUser(): boolean {
  return this.hasPermission('USER_DELETE');
}
```

```html
<!-- No template -->
<button *appHasPermission="'USER_DELETE'" (click)="deletarUser()">
  Deletar Usuário
</button>
```
