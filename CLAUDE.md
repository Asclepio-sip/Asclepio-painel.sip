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

### Catálogo online

- **Painel — tudo numa tela só: `page/catalogo-design`** (rota `/catalogo-design`, botão "Personalizar Catálogo" na sidebar, permissão `VerConfigConta`; `/catalogo-online` redireciona pra ela). A tela antiga `page/catalogo-online` foi removida. Liga/desliga + link: `GET /config-conta` traz `catalogoOnlineAtivo` e `nomeLink`. `PATCH /config-conta/catalogo-online` (`{ ativo }`) liga/desliga para a **empresa inteira**, com troca otimista e rollback se falhar. O nome do link é criado com `POST /config-conta/nome-link` (1ª vez) e trocado com `PUT` (`{ nomeLink }`); regra: 3–60 caracteres, `^[a-z0-9]+(-[a-z0-9]+)*$`, único entre empresas (400 "já está em uso"). O front valida antes de enviar; erros de `@Valid` já voltam 400 com a mensagem da regra. Sem `EditarConfigConta` a tela é só leitura.
- **Link público tem só o nome**: `<origin>/catalogo/{nomeLink}` (nunca o lojaId no link).
- **Página pública** (`page/catalogo-publico`, rota `/catalogo/:nomeLink`, **sem guard** e sem sidebar — `app.ts` trata `/catalogo/` como rota pública): lista as lojas com `GET /catalogo-online/{nomeLink}/lojas` (escolhe sozinha se houver uma, senão mostra chips) e os produtos com `GET /catalogo-online/{nomeLink}/lojas/{lojaId}/produtos` (filtros `nomeProduto`, `categoriaId`, `somentePromocao`); categorias vêm de `GET /catalogo-online/{nomeLink}/categorias` (público, só ativas, em ordem de nome; o `id` vai em `?categoriaId=`). **Não use `GET /categorias` aqui** — é do painel e exige login + `VerCategoria`. `404` = nome inexistente, catálogo desligado ou loja de outra empresa → "Catálogo indisponível". O `authInterceptor` não manda token para `/catalogo-online/`.
- **Design do catálogo** (`page/catalogo-design`, rota `/catalogo-design`, permissão `VerConfigConta`; salvar exige `EditarConfigConta`): `GET`/`PUT /config-conta/design-catalogo` com `modeloCard` (`PADRAO | RETANGULAR | GRANDE | COMPACTO`), `descricaoRodape` (≤1000), `whatsapp`/`telefoneSuporte` (**só dígitos**, 10–13; a tela mostra formatado), `instagram`/`facebook`/`tiktok` (@usuario ou link, ≤150) e `emailSuporte`. O **PUT substitui tudo** — sempre mande o formulário inteiro; vazio vai como `null` (apaga). A página pública lê `GET /catalogo-online/{nomeLink}/design`, aplica a classe `modelo-*` na grade e renderiza o rodapé com `shared/catalogo-rodape` (o mesmo componente da prévia do painel). Se o design falhar, segue com `PADRAO` e sem rodapé.
- **Logo e banner** usam o mesmo componente `shared/catalogo-imagem-upload` (`tipo="logo" | "banner"`): `GET /config-conta/{tipo}` → `{ {tipo}Url, {tipo}Ativo }` (url null = nunca enviada), `POST` (1ª vez, já fica ativa) / `PUT` (troca e apaga a antiga) como **multipart** campo `imagem`, `PATCH /config-conta/{tipo}/status` `{ ativo }`. O front barra não-imagem e > 15 MB (o backend devolve 500 nesses casos). Logo: máx. 512px e **transparência vira branco** no backend. Na página pública vêm em `design.logoUrl` / `design.bannerUrl` (só preenchidos se existem e estão ativos).
- **Cores e opções do design** (mesmo PUT do design): `corPrimaria`, `corSecundaria` (fundo do rodapé), `corFundo`, `corNavbar` (fundo do topo, padrão `#FFFFFF`) e `corTextoNavbar` (texto/ícones do topo, padrão `#1F2937` — **escolhido à mão**, sem contraste automático; o painel só avisa se ficar ilegível) em `#RRGGBB` (null = `CORES_PADRAO`); `mostrarBotaoWhatsapp` (null = desligado; ligado exige `whatsapp`, senão 400) e `mostrarIconesRedesSociais` (null = ligado; desligado esconde Instagram/Facebook/TikTok do rodapé). Sempre passe a resposta por `normalizarDesign()`. As cores viram variáveis CSS (`variaveisTema()`: `--cor-primaria`, `--cor-secundaria`, `--cor-fundo` + `-texto` com contraste automático, e `--cor-navbar`/`--cor-navbar-texto`) aplicadas na página pública e na prévia — use `var(--cor-...)` em vez de cor fixa nessas telas.
- **Modelo do topo (navbar)** (mesmo PUT do design): `modeloNavbar` = `PADRAO` (logo + nome; busca/categoria na barra de filtros) | `LOGO_BUSCA_CATEGORIAS_HORIZONTAL` (busca no topo + chips de categoria em linha embaixo) | `LOGO_BUSCA_BOTAO_CATEGORIAS` (busca no topo + botão que abre a lista de categorias). Vazio/null = `PADRAO`. O backend só guarda a escolha; o desenho é todo do front (`catalogo-publico` + miniaturas/prévia em `catalogo-design`). Categorias vêm de `GET /catalogo-online/{nomeLink}/categorias`.
- **Pedido pelo catálogo** (tudo público): botão "Adicionar" nos cards → carrinho **por loja** no `localStorage` (`catalogo-carrinho:{nomeLink}:{lojaId}`), mesma variação soma na linha existente (o backend recusa variação repetida). A gaveta `shared/catalogo-carrinho` só mostra/edita o carrinho; "Continuar" navega para a página `page/catalogo-finalizar` (rota pública `/catalogo/:nomeLink/lojas/:lojaId/finalizar`, lê o carrinho do `localStorage`), que tem o formulário + resumo e a tela de sucesso. "Editar carrinho"/voltar usam `/catalogo/{nomeLink}?loja={id}&carrinho=1` (mantém a loja e reabre a gaveta). A página de finalizar lê `GET /catalogo-online/{nomeLink}/lojas/{lojaId}/checkout` (`tiposAtendimento` só `RETIRADA_NA_LOJA`/`ENTREGA_PROPRIA`, `formasPagamento` `{ forma, descricao }`, `bairros` com `valorFrete`, `valorMinimoFreteGratis`) e envia `POST .../pedidos` (`formaDePagamento` = `forma`; entrega exige `bairroId` + `endereco`). Resposta: `{ codigoRastreio, status, statusUrl }`. O frete na tela é estimativa — o backend recalcula. O botão "Finalizar" trava no clique até a resposta (limite de **5 pedidos/min e 20/h por IP**, 429 com `message`). `GET .../formas-pagamento` existe mas o `/checkout` já traz as mesmas formas.
- **Acompanhar pedido** (`page/catalogo-acompanhar`, rota pública `/catalogo/:nomeLink/acompanhar?codigo=`; botão "Meu pedido" na navbar do catálogo e "Acompanhar pedido" na tela de sucesso): `GET /pedidos/status/{codigoRastreio}` → `{ codigoRastreio, status }` (`AGUARDANDO | SEPARACAO | EM_TRANSITO | CONCLUIDO | CANCELADO`), sem dados do cliente e sem dizer se é entrega ou retirada. 404 = código inexistente; 400 = concluído há mais de 24h ("prazo ... encerrado"). O código tem **20 caracteres A–Z/0–9** (`SecureRandom`), então o front normaliza para maiúsculas e guarda os últimos 5 pedidos do navegador em `localStorage` (`catalogo-pedidos:{nomeLink}`) para o cliente não precisar digitar. O `authInterceptor` não manda token para `/pedidos/status/`.
- `valorFinal` já vem com desconto do backend — não recalcular. A paginação vem no formato `VIA_DTO` (`{ content, page: {...} }`); `CatalogoOnlineService` aceita esse e o formato "flat".

## Evitar erro

### Nome de arquivo com maiúsculas/minúsculas erradas (disco exFAT)

O projeto fica num disco **exFAT** (`/run/media/mateus/Arquivo`), que não diferencia maiúsculas de minúsculas. Um arquivo salvo com a caixa errada (ex.: `ADMIN-USERS.TS`) abre normalmente no editor, mas imports e o build tratam o nome de forma diferente, e no backend Java o arquivo `CONTROLLERUSUARIO.JAVA` chegou a ser **ignorado em silêncio** pela compilação. Sempre crie/renomeie arquivos com a caixa exata usada nos imports. Para corrigir só a caixa no exFAT, renomeie em dois passos: `mv ARQUIVO.TS tmp && mv tmp arquivo.ts`.

### Erro na tela que na verdade é do backend

- `500` com `"message": "No static resource <rota>"` = o backend **não tem nenhum controller** para aquela rota (não é bug do front). Já aconteceu: o `ControllerUsuario` não foi compilado (arquivo com nome em caixa alta) e toda a tela de usuários parou (`GET /user?page=0&size=10`). Confira no backend: `find target/classes -name "NomeDoController.class"` e reinicie a aplicação.
- `401`/`403` → o `authInterceptor` faz logout e manda para `/login`. Se a tela continua aberta mostrando erro, o status é outro (geralmente 400/404/500) — olhe a aba Network (status + Response) antes de mexer no código do front.
- Chamar a API com `curl` sem token sempre dá `403`; isso não indica problema.

### Não supor endpoints

Antes de chamar uma rota nova, confirme no backend (`@RequestMapping`/`@GetMapping`... na interface `*Api`) que ela existe e qual o formato de request/response. Já houve código no front chamando `/user-loja` e `GET /user/{id}/lojas` antes de existirem.
