# 🚀 Projeto Pipiopo - Sistema Completo (Frontend + Backend)

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-green)
![Angular](https://img.shields.io/badge/Angular-16-red)
![Node.js](https://img.shields.io/badge/Node.js-20-green)

---

## 📖 Descrição do Projeto

Este projeto é um **sistema web completo**, dividido em **frontend (Angular 16+)** e **backend (Spring Boot + Java 21)**, que implementa:

* Tela de login e registro de usuários
* Sistema de autenticação e autorização com **JWT (Token)**
* Diferentes tipos de usuários com permissões específicas
* CRUD de produtos
* Estrutura modular para fácil manutenção e expansão

O objetivo é fornecer uma **base sólida** para aplicações web que precisem de login seguro, controle de permissões e gerenciamento de produtos.

---

Link do back-end -> https://github.com/mateus26guerra/projeto_base_de_telas_e_login

link do video do projeto -> https://www.youtube.com/watch?v=QNbRW_KyXCE&feature=youtu.be


## 👥 Tipos de Usuários

1. **Visitante (sem login)**

   * Acessa apenas a parte pública do site
   * Pode ver a lista de produtos públicos

2. **Usuário (USER)**

   * Pode criar produtos
   * Não pode deletar produtos nem criar usuários

3. **Administrador (ADMIN)**

   * Pode criar usuários
   * Pode criar, listar e deletar produtos

---

## ⚙️ Backend - Spring Boot + Java 21

### Estrutura

```
src/main/java/
 ├─ adapter/
 │   ├─ in/web/controllers/        → Controllers REST
 │   ├─ out/persistence/           → Adapters para DB (JPA)
 ├─ domain/
 │   ├─ model/user/                → Modelo de usuário e roles
 │   ├─ model/product/             → Modelo de produto
 │   └─ UseCase/                   → Regras de negócio
 └─ tudo/security/                 → Configurações de Spring Security e JWT
```

### Funcionalidades

* **Autenticação:** `/auth/login` e `/auth/register`
* **CRUD de usuários (ADMIN):** `/auth/admin/users`
* **CRUD de produtos:** `/products`
* **Controle de acesso:**

  * Admin: cria usuários, cria/deleta produtos
  * User: cria produtos
  * Visitante: apenas lista pública de produtos

### Segurança

* **JWT** usado para autenticação
* **Roles** definidas (`ADMIN`, `USER`)
* **Spring Security** com filtros personalizados
* CORS configurado para `http://localhost:4200`

### Rodando o Backend

1. Configurar o **Java 21** e **Maven**
2. Rodar o projeto:

```bash
mvn clean install
mvn spring-boot:run
```

3. A API estará disponível em:

```
http://localhost:8080
```

---

## ⚡ Frontend - Angular 16+

### Estrutura

```
src/
 ├─ app/
 │   ├─ components/        → Componentes (login, registro, produtos)
 │   ├─ services/          → Serviços HTTP e JWT
 │   ├─ models/            → Models (User, Product)
 │   ├─ guards/            → Proteção de rotas por roles
 │   └─ app.module.ts      → Configuração principal
 ├─ assets/                → Arquivos estáticos
 └─ environments/          → Configurações de dev/prod
```

### Funcionalidades

* **Login e Registro**
* **Armazenamento do token JWT no localStorage**
* **Rotas protegidas por roles** (`ADMIN`, `USER`)
* **Listagem pública e privada de produtos**
* **CRUD de produtos** (de acordo com a role)

### Chamadas ao Backend

| Método | Endpoint               | Quem Pode Acessar |
| ------ | ---------------------- | ----------------- |
| POST   | /auth/login            | Todos             |
| POST   | /auth/register         | Todos             |
| GET    | /productsPublico/list  | Visitantes        |
| GET    | /products/list         | User/Admin        |
| POST   | /products/add_products | User/Admin        |
| DELETE | /products/{id}         | Admin             |

### Rodando o Frontend

1. Configurar Node.js 20+ e Angular CLI 16+
2. Instalar dependências:

```bash
npm install
```

3. Rodar o frontend:

```bash
ng serve
```

4. Abrir no navegador:

```
http://localhost:4200
```

---

## 🔐 Fluxo de Autenticação

1. Usuário faz login → Backend retorna **JWT**
2. Frontend armazena token no **localStorage**
3. Requests privados adicionam o token no header:

```
Authorization: Bearer <TOKEN>
```

4. Spring Security valida token e roles para autorizar ações

---

## 💡 Observações

* Projeto modular, fácil de adicionar novas features
* JWT e guards garantem que usuários só façam o que têm permissão
* Estrutura pronta para integração com banco de dados relacional via JPA/Hibernate
* Base pronta para evoluir para produção

---

## 📂 Como Contribuir

1. Clonar o repositório

```bash
git clone <SEU_REPO>
```

2. Rodar backend e frontend localmente
3. Criar branch para suas alterações

```bash
git checkout -b feature/nova-funcionalidade
```

4. Commitar e enviar PR

```bash
git commit -m "Descrição da alteração"
git push origin feature/nova-funcionalidade
```

---

## 🛠 Tecnologias

* **Backend:** Java 21, Spring Boot, Spring Security, JWT, Maven
* **Frontend:** Angular 16+, TypeScript, HTML, CSS
* **Banco de dados:** H2 / PostgreSQL (configurável)
* **Autenticação:** JWT
* **Controle de acesso:** Roles (`ADMIN`, `USER`)

---

## 📌 Observação Final

Este README fornece uma **visão completa do projeto Pipiopo**, cobrindo tanto backend quanto frontend, tipos de usuários, permissões, autenticação JWT e instruções para rodar localmente.

```
```

```
```
