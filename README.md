# nextlab

nextlab é uma plataforma em desenvolvimento para conectar estudantes e desenvolvedores de tecnologia do Cariri a projetos, oportunidades e experiências práticas.

O nome une "Next" (próximo, futuro) e "lab" (laboratório). A ideia é representar um laboratório de próxima geração: um ambiente para experimentar, aprender, construir software real e transformar conhecimento técnico em projetos com valor concreto.

Domínio oficial: https://www.nextlab.tec.br/

## Propósito

O projeto nasceu de uma dificuldade real: encontrar projetos para participar, pessoas para colaborar e oportunidades técnicas próximas da realidade local. O nextlab busca organizar esse espaço em uma plataforma viva, onde estudantes possam criar maturidade técnica, colaborar em iniciativas reais e construir portfólio a partir de experiências práticas.

Mais do que uma aplicação, o nextlab também documenta uma jornada de aprendizado de ponta a ponta: backend, API REST, autenticação, banco de dados, testes, qualidade de código, infraestrutura local, deploy, DNS e comunicação por e-mail.

## Fase atual

A base de autenticação da API já está funcional e coberta por testes. Atualmente o projeto contempla cadastro de usuários, envio de e-mail de ativação, ativação de conta, login, sessões, consulta de usuário autenticado, status da aplicação e fluxo de migrations.

Os próximos passos são a construção dos endpoints de conteúdo, evolução da interface da aplicação e consolidação da experiência pública no domínio `nextlab.tec.br`.

## Funcionalidades

- Cadastro de usuários com validações de domínio.
- Ativação de conta por token enviado por e-mail.
- Autenticação por sessões.
- Consulta e atualização de usuário.
- Endpoint de status com informações do banco de dados.
- Migrations versionadas para evolução segura do schema.
- Testes automatizados para fluxos de use case e integração.
- Ambiente local reprodutível com Docker Compose.

## Stack principal

- Node.js 24
- Next.js
- React
- PostgreSQL
- Docker Compose
- node-pg-migrate
- Jest
- SWR
- Nodemailer
- ESLint
- Prettier
- Commitlint e Commitizen

## Arquitetura

```text
pages/api/v1/        Rotas HTTP da API
models/              Regras de domínio e casos de uso
infra/               Banco, e-mail, servidor, erros e scripts
infra/migrations/    Evolução versionada do banco de dados
tests/               Testes unitários, integração e use cases
docs/                Documentação de aprendizado e estudos do projeto
```

## API

| Método   | Rota                             | Descrição                                             |
| -------- | -------------------------------- | ----------------------------------------------------- |
| `GET`    | `/api/v1/status`                 | Retorna informações de saúde da aplicação e do banco. |
| `GET`    | `/api/v1/migrations`             | Lista migrations pendentes.                           |
| `POST`   | `/api/v1/migrations`             | Executa migrations pendentes.                         |
| `POST`   | `/api/v1/users`                  | Cria uma nova conta de usuário.                       |
| `GET`    | `/api/v1/users/[username]`       | Consulta um usuário público pelo username.            |
| `PATCH`  | `/api/v1/users/[username]`       | Atualiza dados de um usuário.                         |
| `GET`    | `/api/v1/user`                   | Retorna o usuário autenticado.                        |
| `POST`   | `/api/v1/sessions`               | Cria uma sessão de login.                             |
| `DELETE` | `/api/v1/sessions`               | Encerra a sessão atual.                               |
| `PATCH`  | `/api/v1/activations/[token_id]` | Ativa a conta usando o token recebido por e-mail.     |

## Como rodar localmente

### Requisitos

- Node.js 24
- npm
- Docker e Docker Compose

### Instalar dependências

```bash
npm install
```

### Subir serviços locais

```bash
npm run services:up
npm run services:wait:database
```

### Preparar banco de dados

```bash
npm run db:reset
npm run migrations:up
```

### Iniciar ambiente de desenvolvimento

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Scripts úteis

| Script                          | Descrição                                          |
| ------------------------------- | -------------------------------------------------- |
| `npm run dev`                   | Inicia o runner local de desenvolvimento.          |
| `npm run dev:build`             | Sobe serviços, prepara o banco e inicia o Next.js. |
| `npm run services:up`           | Sobe PostgreSQL e Mailcatcher.                     |
| `npm run services:stop`         | Pausa os serviços locais.                          |
| `npm run services:down`         | Remove os containers locais.                       |
| `npm run db:reset`              | Reseta o banco em ambiente local/teste.            |
| `npm run migrations:up`         | Executa migrations pendentes.                      |
| `npm test`                      | Executa a suite de testes.                         |
| `npm run lint:eslint:check-dir` | Valida padrões com ESLint.                         |
| `npm run lint:prettier:check`   | Verifica formatação com Prettier.                  |
| `npm run commit`                | Abre o fluxo de commit padronizado.                |

## Testes

O projeto usa Jest para testes automatizados. A suíte cobre regras de domínio, endpoints da API, infraestrutura de e-mail e o fluxo completo de registro:

1. Criação de conta.
2. Recebimento do e-mail de ativação.
3. Ativação do usuário.
4. Login.
5. Consulta do usuário autenticado.
6. Logout.

Para executar:

```bash
npm test
```

## Documentação

O conteúdo original da jornada de aprendizado foi preservado em [`docs/`](./docs/README.md). Essa documentação contém anotações sobre fundamentos, Git, DNS, Docker, banco de dados, migrations, testes, REST, segurança, autenticação e infraestrutura de e-mail.

## Roadmap

- Criar endpoints de conteúdo.
- Desenvolver a interface principal da aplicação.
- Consolidar o fluxo público no domínio `https://www.nextlab.tec.br/`.
- Evoluir a experiência de contribuição e gestão de projetos.
- Ampliar cobertura de testes conforme novas features forem adicionadas.

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo [`LICENSE`](./LICENSE) para mais detalhes.
