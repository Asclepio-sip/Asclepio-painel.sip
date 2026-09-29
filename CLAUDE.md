# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

Painel administrativo (front-end) do **Asclépio**, SaaS multi-tenant (multi-empresa/multi-loja) de gestão de estoque, produtos, pedidos, lojas/bairros de entrega, clientes e usuários/cargos/permissões. O backend fica em `../../Back-end/Panel-Ascl-pio.sip` (Spring Boot, tem o próprio `CLAUDE.md`) — antes de consumir um endpoint novo, confira o contrato real na interface `*Api` do backend em vez de supor o formato.

Stack: Angular 21 (componentes **standalone**, sem NgModules), TypeScript 5.9, RxJS, `@angular/forms` (template-driven com `ngModel`), Tailwind 3 + Bootstrap 5 + CSS próprio por componente, `sweetalert2` (alertas), `lucide-angular` (ícones), `jspdf` + `html2canvas` (PDF), Vitest (testes via `@angular/build:unit-test`).

## Comandos

```bash
npm start          # ng serve (dev, http://localhost:4200)
npx ng build       # build de produção em dist/frontend — use para validar que compila
npm test           # testes (Vitest)
```

Não há ESLint configurado. Prettier está no `package.json` (`printWidth: 100`, `singleQuote: true`) — siga o estilo já presente no arquivo que estiver editando.

A URL da API vem de `src/environments/environment.ts` (`apiUrl: 'http://localhost:8080'` em dev). Serviços sempre montam a URL com `environment.apiUrl`, nunca com host fixo.

## Arquitetura

```
src/app/
  app.routes.ts       rotas + guards + permissões exigidas por rota
  app.config.ts       provideRouter + provideHttpClient(withInterceptors([authInterceptor]))
  core/
    auth.interceptor.ts        injeta o Bearer token; 401/403 → logout + /login
    guards/auth-guard.ts       só exige estar logado
    guards/admin.guard.ts      exige logado + alguma permissão de route.data.permissions
    public.guard.ts            telas públicas (login/landing/cadastro); logado → getHomeRoute()
    security/app-permissions.ts   nomes das permissões (espelham o backend)
    security/permission-groups.ts grupos usados nas rotas/menus
  service/            um service por domínio (HttpClient), @Injectable({ providedIn: 'root' })
  models/             interfaces compartilhadas (ex.: user-loja.model.ts)
  page/               telas (uma pasta por tela: .ts + .html + .css)
  shared/             navbar, navbar-administrador, sidebar, footer, cart, listas reutilizáveis
```

Padrões seguidos no código:
- **Componentes standalone** com `imports: [CommonModule, FormsModule, ...]`, `templateUrl`/`styleUrl` separados. Os templates misturam `*ngIf`/`*ngFor` (maioria das telas antigas) e o control flow novo (`@if`, `@for (...; track ...)`) — em tela existente siga o que o arquivo já usa; em tela nova prefira `@if`/`@for`.
- A app é **zoneless** (não há `provideZoneChangeDetection`), por isso os componentes chamam `this.cd.detectChanges()` depois de atualizar estado dentro de `subscribe`. Ao criar/alterar uma tela que carrega dados via HTTP, mantenha esse padrão ou a tela não atualiza.
- Services devolvem `Observable` e os componentes fazem `subscribe({ next, error })`. Listagens paginadas usam `HttpParams` (`page`, `size`, filtros, `sort`) e o backend responde `Page<T>` do Spring (`content` + `page.{number,size,totalElements,totalPages}`) — ver `UserAdmin.service.ts` para o padrão de normalização.
- Nomes de arquivos/pastas são inconsistentes (`criar-users/admin-users.ts`, `UserAdmin.service.ts`, `Relatorio-estoque.service.ts`, `add-edit-cartegoria`) — procure o arquivo existente antes de criar outro e siga a convenção da pasta.

### Autenticação e multi-tenant

- Login em dois passos (`AuthService.login` → `escolherLoja`): se o usuário tem mais de uma loja, o backend devolve um token **TEMP** + lista de lojas; o token **FULL** só vem depois de `POST /user/escolher-loja`. O interceptor não sobrescreve o header nessa rota.
- Token fica em `sessionStorage` (`token`, `nomeLoja`). `AuthService` decodifica o JWT no cliente: `getEmpresaId()`, `getLojaId()`, `isGerente()`, `getNomeExibicao()`, `getPermissions()`.
- Autorização é por **permissão nominal** vinda do JWT (`hasPermission` / `hasAnyPermission`), não por nome de cargo. Rotas protegidas usam `canActivate: [adminGuard], data: { permissions: PermissionGroups.x }`. Ao adicionar uma permissão nova, ela precisa existir no backend (`DataInitializer`) e em `app-permissions.ts`.
- `SISTEMA_PERMISSOES_README.md` e `GUIA_RAPIDO_PERMISSOES.txt` estão **desatualizados** (citam `PermissionService`, diretiva `*appHasPermission` e permissões `PRODUCT_READ` que não existem mais). A fonte da verdade é `core/security/` + `AuthService`.

### Gestão de equipe (`page/criar-users`)

- "Adicionar Membro" **só cria usuário novo** (`POST /user` com `{ nome, email, password, lojas: [{ lojaId, roleId }] }`); o login é gerado pelo backend.
- "Gerenciar Acessos" carrega `GET /user/{id}/lojas` (resposta plana: `{ lojaId, lojaNome, roleId, roleNome }[]`, tipo `LojaDoUsuario`) e salva com `PUT /user/{id}/lojas` (`{ lojas: [{ lojaId, roleId }] }`). O PUT **substitui o conjunto inteiro** — loja fora da lista perde o acesso. Por isso, se o GET falhar, o salvar fica bloqueado (senão apagaria os acessos atuais).

## Evitar erro

### Nome de arquivo com maiúsculas/minúsculas erradas (disco exFAT)

O projeto fica num disco **exFAT** (`/run/media/mateus/Arquivo`), que não diferencia maiúsculas de minúsculas. Um arquivo salvo com a caixa errada (ex.: `ADMIN-USERS.TS`) abre normalmente no editor, mas imports e o build tratam o nome de forma diferente, e no backend Java o arquivo `CONTROLLERUSUARIO.JAVA` chegou a ser **ignorado em silêncio** pela compilação. Sempre crie/renomeie arquivos com a caixa exata usada nos imports. Para corrigir só a caixa no exFAT, renomeie em dois passos: `mv ARQUIVO.TS tmp && mv tmp arquivo.ts`.

### Erro na tela que na verdade é do backend

- `500` com `"message": "No static resource <rota>"` = o backend **não tem nenhum controller** para aquela rota (não é bug do front). Já aconteceu: o `ControllerUsuario` não foi compilado (arquivo com nome em caixa alta) e toda a tela de usuários parou (`GET /user?page=0&size=10`). Confira no backend: `find target/classes -name "NomeDoController.class"` e reinicie a aplicação.
- `401`/`403` → o `authInterceptor` faz logout e manda para `/login`. Se a tela continua aberta mostrando erro, o status é outro (geralmente 400/404/500) — olhe a aba Network (status + Response) antes de mexer no código do front.
- Chamar a API com `curl` sem token sempre dá `403`; isso não indica problema.

### Não supor endpoints

Antes de chamar uma rota nova, confirme no backend (`@RequestMapping`/`@GetMapping`... na interface `*Api`) que ela existe e qual o formato de request/response. Já houve código no front chamando `/user-loja` e `GET /user/{id}/lojas` antes de existirem.
