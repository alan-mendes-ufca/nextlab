## Fetch, await, async function

> Santíssima trindade do Javascript para buscar dados na internet.

- `async function`: avisa ao js que o retorno dessa função não será imediato, deve-se esperar e não travar a aplicação.
  - Define um contexto assíncrono.
  - Só é possível utilizar o comando await se essa função for async.aspectos

- `fetch`: envia o pedido para alguma API, mas, antes, retorna automaticamente uma promessa de que em algum momento terá um retorno.
  - Função utilizadas para requisições http, semelhantes a classes `request do python`, sendo o último de compotamento síncrono.
  - Devolde um `Promise` antes mesmo de solicitgar algo a API.
  - O conteúdo que é retornado e que será realmente utilizado na aplicação é o objeto `Response`, um envelope fechado com dados da resposta do servidor.
  - Utiliza-se o método `.json` para abrir esse envelope e posteriormente consumir essa informações.

- `await`: para a execuçãio da linha até que o fetch traga realmente os dados.
  - pausa o fluxo do código até que fetch retorne algo diferente de um Promise.
  - só é possível utilizar essa palavra-chave se a função for async.

---

# Como escolher um banco de dados?

- Para a resolução de um bancon de dados é necessário fazer a escolha desses três aspectos do sistema: `SGDB`(Sistema de Gerenciamente de Banco de Dados), `Query`(consultas), `Migrations`.
- **Características de banco de dados**: relacional, não relacional(armazenamnete de documentos, armazenamento de chave-valor), série temporal, espacial.
  - **Principal**: SQL x NoSQL (_Structured Query Language_)

- **SGDB**: `Para o projeto vamos utilizar o **PostgreSQL**.`
- **Query**: `pg.` -`ORM (Object-Relational Mapping): camada de abstração no banco de dados, utilizado para fazer consultas utilizando métodos e funções.`
  - _sequelize_.
  - Vamos fazer todas as consultas na mão!

- **Migrations**: `node-pg-migrate.`
  - arquivo que instrui modificações no banco de dados, versionamento de tabelas, controle de modificações.

---

# Docker

> Antigamente a dificuldade de subir num banco de dados ou aplicação era enorme, pois os programas eram muito sensíveis a "divergências" no sistema operacional das máquinas (Hardware, antivírus, configurações gerais, aplicativos instados) causava conflito com o computador Hosts. > Na minha máquina roda!!!

> Podemos pensar em algo semelhante aos celulares: existêm vários smatphones android com configurações e modificações de sistema diferêntes, dependendo da fabricante. E, bom, cada aplicativos tem que se adequar a rodar nessa variedade de dispositivos - o que causa erros, diferenças de desempenho, etc.

> Para resolver esse problema foram desenvolvidas as máquinas virtuais, que simulavam a instalação de um sistema operacional em uma parte desconexa do sistema, ocupando MUITA memória e processamento!

- ![alt text](imgs/image2.png)

> É uma longa história até o desenvolvimento do `Docker`, que permite o isolamento total de processos, em 'containers', por meio do kernel(namespaces ou cgroups) do sistema operacional(Linux), sem precisa de várias virtual machines.

- ![alt text](imgs/image3.png)

> O que é um `container`? **Ele não é uma máquina virtual!** Conjunto de dependências (binários e bibliotecas) _isolados a nível de processo_ que são executados pelo kernel do sistema operacional.

---

## Docker-compose

- `docker --version`.
- `docker-compose --version`.
- `compose.yaml`

```
+------------+
| Dockerfile |
+------------+
- Código fonte que define instruções (sistema operacional, versão) que vão formar um ambiente base;
- `Receita da aplicação`.
    |
    V
+-------+
| image |
+-------+
- Intruções compiladas;
    |
    V
+---------+
|container|
+---------+
- processo míninmo e isolado que executa as intruções da imagem.
```

- É possível baixar uma imagem do postgres pelo dockerhub (repositório de imagens).
- Após configurar o arquivo `compose.yaml`, executei o comando `docker compose up` para instalar as depêndecias definidas.
- "Compreender problemas, também é conhecimento."
- `docker ps --all`
- `docker logs <container-name>`
- detached ("separado"): `docker compose up -d`
  - como se executasse em segundo plano os processo do container, liberando o terminal.

- psql: instalando o postgres client: `sudo apt install postgresql-client`, assim é possível executar
  - `psql --host=localhost --username=postgres --port=5432`, aconteceu um erro: ainda não existe uma porta para o cliente. Para criar a porta foi definido arquivo compose instruções para portas ("host:container" -> "host:container"). Após isso é preciso reconfigurawr o container:
    - destruir container: `docker compose down` -> `docker compose up` ou `docker compose up -d --force-recreate` (faz os dois ao mesmo tempo). Por fim foi possível entrar no ambiente `postgres=#`.

```sql

  postgres=# SELECT 1+1;
   ?column?
  ----------
          2
  (1 row)

```

- como o arquivo compose foi movido para o diretório intra/ será necessário ajustar o comando para incializar o container: `docker compose -f infra/compose.yaml up`.
  - _Existem formas de simplificar essa inicialização com scripst npm._
    > Modifiquei os scrips, agora basta rodar: `npm run container:init`, `npn rum postgres`.

---

# database.js

- Primeiramente ele foi importado para a páguina de status, após isso foi inserido:

```js
// Objeto literal, não um json. Ele chama métodos/funções, não texto puro(como um json).
export default {
  query: query, // chave:valor
};
```

- O que diabos isso faz? Bom, inicialmente define um objeto padrão de exportação { query:query, }. Mas, afinal, o que é esse objeto? É um objeto Javascript que exporta métodos/funções.
- Agora no index.js que importou esse objeto:

```js
import db from "../../../../infra/database.js";
// como o objeto não é nomeado(na verdade, por conta do modelo de exportação ser 'export default' objeto pode receber um apelido),
//  é literal, quem difene seu nome é quem o exporta.
```

---

# Variáveis de ambiente

- Stateless("Sem estado"): mover a camada de persistência para um outro local, deixando o backend só com as regras de negócio.
  - O backend vira uma máquina pura, só executa código.
  - Atualmente as credênciais estão hardcoded, fazendo com que o backend não esteja stateless, se o código for clonado para outro contexto o database local continuará sendo a persistência, para todos os clones:
    ```js
    const client = new Client({
      host: "localhost",
      port: 5432,
      user: "postgres",
      database: "postgres",
      password: "local_password",
    });
    ```
- Para deixar isso mais flexível é preciso definir as variáveis de ambiente.

- `POSTGRES_PASSWORD=local_password npm run dev`.
  Esse comando define, no env do terminal, a variável de ambiente `POSTGRES_PASSWORD`, apenas para o processo que for rodado **em seguida**: `npm run dev`. Essa não é a melhor forma de se fazer.
- **DICA**: Para digitar algo sensível no terminal basta fazer: ` ...command...`.
  (espaço comando)

- `dotenv`: carrega as variáveis de ambiente definidas em um arquivo `.env`(na raiz do projeto) no objeto js `process.env`.
  - O next.js recomenda que o arquivo _.env seja commitado_, mas a documentação do dotenv recomenda que _não deve ser commitado_.
    A vercel aplica o contrário da documentação do módulo, pois, durante o deploy, é possível definir variáveis de ambiente na plataforma, sobrescrevendo o arquivo .env "local".

- `Por que renomear o arquivo .en para .env.development?` É uma forma de `organizar e separar as variáveis de ambiente por contexto.`
  - `.env.development`: desenvolvimento local;
  - `env.production`: produção, ou seja, quando está rodando para usuários finais;
  - `env.test`: testes automatizados (banco de dados dedicado a testes);
  - `env.staging`: homologação, validação da aplicação.

- E se eu commitar um arquivo com dados sensíveis/confidenciais? `git filter-repo`, trocar senhas, apagar chaves de api.

---

# Absolute Imports

- `app-root-path`(encontra a pasta node_modulos e volta uma camada, encontrando a root do projeto);
- `jsconifg.json`(a presença desse arquivo em um diretório indica que aquele diretório é a raiz do javascript-project);
- `tsconifg.json`(a presença desse arquivo em um diretório indica que aquele diretório é a raiz do typescript-project).

```json
// "compilerOptions": jsconig.json é descendente do tsconfig.json (Typescript é complilado!)
{
  "compilerOptions": {
    "baseUrl": "." // indica que a raiz do projeto é o diretório atual(`.`simboliza o dir atual, `..` o anterior)
  }
}
```

---

# Querys parametrizadas

> Segundo a documentação node-postgres: Se estiver passando parâmetros de consulta, evite **concatena-los** diretemente no texto da consulta. Isso frequentimente leva a vulnerabilidade de `SQL injections`.

```js
/* 
Forma `segura` de estruturar consultas com um objeto `query`. 
- A query é pré-compilada pelo banco, ou seja, o banco separa o comando SQL dos dados:
  - Valida a código de consulta, recebido anteriormente;
  - Trata dados como dados, não como código SQL.
*/
const query = {
  text: "INTER INTO users(name, email) VALUES($1, $2) RETURNING *",
  values: ["Alan Mendes Vieira", "alan.mendes@aluno.ufca.edu.br"],
};

// Forma vulnerável

// input malicioso
const name = "'; DROP TABLE users; --";
const email = `INSERT INTO users(name) VALUES('${name}')`;

const invalid_query = `INSERT INTO users(name, email) VALUES ('${name}', '${email}') RETURNING *`;

// Outra forma de formatar essa string
const invalid_query =
  "INSERT INTO users(name, email) VALUES ('" +
  name +
  "', " +
  email +
  "') RETURNING *";
```

---

# Opções de hosteamento por terceiros

- É uma escolha MUITO válida dentro de um contexto real onde manter um serço rodando de forma integral é um desafio (90% das aplicações utilizam esse método).
- Estou utilizando `Neon` para realizar a tarefa de hospedar o banco de dados.
- No curso foi apresentado outra ferramenta: `DigitalOcean`, que é paga. E nela temos algumas especificidades: além do SSl requerido, é preciso ter uma validação de certificado.
  - `Self-signed certificate (Certificado Autoassinado)`.
  - EXPLICAÇÃO DE NÍVEL 1:
    O protocolo TCP valida e confirma conexões entre servidores como seguras por meio de um certificado. Ao utilizar o serviço da DigitalOcean, **o certificado é gerado e assinado pela própria digitalOcean**.
    Isso é identificado como um problema pelo node.js, que espera um certificado gerado por uma autoridade terceira - geralmente são informações que já vem com o sistema operacional. Como o certificado da DigitalOcean não faz parte dessa lista, o Node.js o identifica como potencialmente inseguro.
    Para resolver esse problema, **é necessário informar ao Node.js o certificado raiz gerado para seu usuário na plataforma**, isso é feito por meio da variável de ambiente : `POSTGRES_CA`, encaminhado na configuração SSL da conexão com o banco.

---

# Migrations

> Um projeto que não utiliza migrations é semelhante a um que não utilizar o git.

- Banco de dados
  - Estruturas de um banco de dados: linhas + colunas = `tabela`.
  - Uma grande diferença entre uma tabela de excel e um banco de dados relacional é a `tipagem de dados`.
  - Diferenças dos bancos entre os ambientes de desenvolvimento.

- `Database Schema Migrations` é uma forma de fazer alterações no schema de um banco de forma manual, transformando em código.
  - Possibilitam o versionamento do `schema` do banco de dados e processos relacionados a essa possibilidade;
  - Essa ferramenta é sustentada por dois pilares:
    - `Arquivos de migração` (Ordem, alterações);
    - `Framework de migração` (Ordem, uma única vez).

- `Framework para migrations`: node-pg-migrate;
  - Arquivos migrations criados utilizam `unix timestamp` para definir _ordem de execução_;
  - Armazenam as `Diffs` definidas em todas as migrações, rodando em sequência todas as migrations.
  - E quanto eu tenho um schema/banco que tá no meio das migrations?
    - Dentro do banco existe uma tabela interna com as migrations que já foram aplicada, assim são apĺicadas apenas as que faltam.
  - Ferramenta de linha de comando, verifique o package.json para vizualizar o comando original.
  - Por padrão, o framework procura as credênciais do banco de dados no objeto `process.env.DATABASE_URL`, onde obviamente essa informação deve estar definida no arquivo `.env`.

  - `DATABASE_URL` atualmente está hardcoded no arquivo `.env.development`, para resolver o problema de interpolação, foi necessário adicionar o `dotenv-expand` no projeto.

- Desenvolvimento do endpoint `/migrations`:
  - GET: Dry run
  - POST: Wet run
  - Direction : up x down
    - Roll*back* (reverter) x Roll*forward* (avançar)
      - > Why rollback when you can rollforward? - How we make deploys? - StackOverflow 2016.
  - Limpar o banco para que os testes sempre partam do mesmo contexto!
    - GarbageDB x Transaction
    - É preciso rodar os testes de forma serial para evitar erros: `jest --runInBand` - Aumentando a confiabilidade do teste!
    - _O Jest@10.8.2 não suporta o `ECMAScript Modules (ESM)`! Diferente mente do next.js,
      que utiliza um compilador `swc` para transpilar seu código moderno, para versões anteriores.
      Além de muitas outras configurações fornecida pelo next.js._ - Vamos fornecer os recursos do next.js para o Jest por meio do jest.config.js - arquivo de configuração especial.
      - **Desafio 1**: provar que o jest de fato está rodando no ambiente de testes, env.development não são carregas.

      ```js
        test("GET to /api/v1/migrations should return 200", async () => {
        // Desafio 1 - completo
        const q = await db.query("SELECT 2+2;");
        console.log(q);
        // Essa é uma tentativa de fazer uma query no banco, o que com certeza
        // está acontecendo é que process.env.NODE_ENV está retornando true, já
        // que test != development.

        /*
        FAIL tests/integration/api/v1/migrations/get.test.js
        ● Console

        console.log
        test

            at log (infra/database.js:44:11)

            --- Esse log comprova a hipótese!

        */
          console.log("🔍 NODE_ENV:", process.env.NODE_ENV);
          console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL);
          console.log("🔍 POSTGRES_PASSWORD:", process.env.POSTGRES_PASSWORD);

        /*● Console

        console.log
          🔍 NODE_ENV: test

          at Object.log (tests/integration/api/v1/migrations/get.test.js:15:11)

        console.log
          🔍 DATABASE_URL: undefined

          at Object.log (tests/integration/api/v1/migrations/get.test.js:16:11)

        console.log
          🔍 POSTGRES_PASSWORD: undefined

          at Object.log (tests/integration/api/v1/migrations/get.test.js:17:11)*/

      ```

      - **Desafio 2**: conseguir carregar essa variáveis no banco de dados.
        - `O Jest define por padrão o seu NODE_ENV = 'test', o que implica que ele não vai acerssar as variáveis de ambiente definidas em .env.development`.
          Consigo enxergar duas possibilidades para solução desse problema: criar uma cópia de .env.development como .env.test, ou definir em jestconfig que ele utilize o ambiente 'development'.
        - Bom, seguindo a convenção vou aplicar a primeira solução. Até porque será possível criar um banco próprio para testes!

---
