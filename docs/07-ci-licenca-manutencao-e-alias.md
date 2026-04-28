# Homologação / Staging / Preview

- Se uma nova branch for criada e enviada para o github a vercel faz o deploy de forma automática;
  - Utilizando a estrutura da vercel, o deploy é feito de feito de forma idêntica para diferentes ambiente. Digo, não existe diferença de deploy entre homologação e produção, o que realmente vai diferir os dois são as variáveis de ambiente.

---

# Continuous Integration (CI)

- Primordialmente, o fluxo de desenvolvimento era realizado em forma de cascata (requisitos -> projeto -> implementação -> validação -> implantação), mas isso mudou com o surguimento da `Metodologia Ágil`:

  > "Estamos descobrindo maneiras melhores de desenvolver
  > software, fazendo-o nós mesmos e ajudando outros a
  > fazerem o mesmo. Através deste trabalho, passamos a valorizar:

  > **Indivíduos e interações** _mais que processos e ferramentas_
  > **Software em funcionamento** _mais que documentação abrangente_
  > **Colaboração com o cliente** _mais que negociação de contratos_
  > **Responder a mudanças** _mais que seguir um plano_

  > Ou seja, mesmo havendo valor nos itens à direita,
  > valorizamos mais os itens à esquerda."

- `Posteriormente`, por meio do Manifesto Ágil, a cultura ágil foi implementada no meio de desenvolvimento de software e como consequência de sua radicalização, `o que deveria ser uma estrutura saudável se tornou um produto`. O desgaste da metodologia ágil cuminou com o movimento `"Morte ao ágil"`, que questionáva a aplicação errônea da metoodologia: `as empresas passaram a focar excessivamente nos itens à esquerda do manifesto, descartando quase completamente princípios organizacionais básicos e fundamentais, representados pelos itens à direita.`

- `Integração contínua`: estruturação do ciclo de desenvolvimento baseando-se em sprints, ciclos de poucos dias entre a evolução do sistema e a velidação com o cliente;
- Para implementação desses novos fluxos de trabalho foi necessário `automatizar` _partes_ do desenvolvimento de software por meio de linguagens compiladas, testes automatizados, controle de versão, etc;

- **CD** (Continuous integration/Continuous Delivery): depois de toda a validação o CD fica responsável pela automatização do processo de deploy da aplicação;

- **CA/CD**: como os dois estão muito relacionados, um conceito acompanha o outro;

- Essas automatizações também previnem downtimes ocasionados por erro humano.

- `Continuous Integration -> Continuous Delivery -> Continuous Deployment`;
  - O CDeployment automatiza ainda mais o deploy: se os processos anteriores ao deploy foram finalizados, ele é feito de forma automática;
  - `Robozinho da vercel`.

  ***

  ### Race Condition
  - Situação onde dois ou mais processos tentam acessar um recurso ao mesmo tempo.

  ***

  ### Estabilizar Ambiente Local
  - npm rum dev` passa rodar as migrations por meio de um script recursivo que valida se a conexão está disponível ou não (`docker exec postgres-dev pg_isready --host localhost`);
  - Após a implementação básica eu refatorei utilizando o módulo `cli-spinner` para adicionar um loading mais visual, e por recomentadação da ia eu utilizei a função `setTimeout()` para fazer a recução de forma assíncrona.

  ***

  ### Estabilizar Teses Locais
  - `npm run test` inicializa o banco, o servidor e executa os testes;
  - `Orchestrator`: modelagem da infroestrutura dos testes;

  - Versão que eu implementei:

    ```js
    async function waitForAllServices() {
      await waitForWebServer();

      async function waitForWebServer(maxRetries = 10, delay = 500) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const response = await fetch("http://localhost:3000/api/v1/status");
            const data = await response.json();

            if (data && response.status === 200) {
              return;
            }
          } catch (error) {
            if (i === maxRetries - 1) {
              throw new Error(
                "Server não respondeu após multiplas tentativas.",
              );
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }
    ```

  #### DÚVIDA: _por que utilizar o módulo `concurrently` para rodar o next e jest_?
  - Primeiramente, rodar processos de forma concorrente é sinônimo de roda-los de forma paralela? Definitivamente não, são formas bem distintas de rodar processos:
    - **Concorrência**: as tarefas **progridem** ao mesmo tempo, sendo executadas **simultaneamente** no mesmo CPU;
      - ```md
        Tarefa A: ████░░░░████░░░░
        Tarefa B: ░░░░████░░░░████
        ─────────────────► tempo
        (mesma CPU alternando)
        ```

    - **Paralelismo**: as tarefas executam ao **mesmo tempo**, em CPUs diferentes;
      - ```md
        CPU 1: ████████████████
        CPU 2: ████████████████
        CPU 3: ████████████████
        CPU 4: ████████████████
        ─────────────────► tempo
        (execução simultânea real)
        ```

    - Por fim, sanando a dúvida: O `next dev` **nunca termina** - ele fica rodando o servidor indefinidamente. Então o Jest nunca seria executado!
      Assim, rodando **concorrentemente**, ambos ficam ativos ao mesmo tempo e quando os testes terminam o servidor é fechado.

  ***

  ### Estabilizar CI
  - github actions: é uma **integração** do github que permite **automatizar fluxos de trabalho** (CI/CD);
    - Para utilizar a ferramenta basta criar um diretório `.github/workflows` na raiz do projeto, essa pasta deve conter um arquivo `.yaml` que configura o processo;
    - DÚVIDA: Qual a diferença entre utilizar `npm install` x `npm ci`?
      1. `npm ci`: utiliza **apenas** as dependências do `package-lock.json` (_falha se não existir o arquivo no diretório_);
      2. `npm install`:
      - **SE** o `package-lock.json` existir no diretório (_e está consistente com o package.json_) instalará as versões exatas presentes no arquivo,
        - no caso de existir inconsistências entre os arquivos, o npn resolve as dependencias e atualiza o lock.
      - **SENÃO** instalará as versões dentro do range descrito no `package.json` ("^18.1.3" - > 18.x.x);
      3. Para atualzar todas as dependências do projeto: `npm update`.

      No geral, o `npm install` é utilizado para instalar/adicionar as dependências do projeto (desenvolvimento local) e, no ambeinte de produção/CI utiliza-se o `npm ci`.
      - Informação adicional: ao intalar um pacote é possível utilizar: `npm i --save-dev` ou `npm i -D` para instalar o pacote apenas como **dependência de desenvolvimento**, ou seja, **NÃO será instalada no ambiente de produção**.

  ***

  ###
  1. O primeiro `workflow` adicionado foi o `test.yaml` que é responsável proi rodar os testes durante o deploy;
  2. O segundo, `linting.yaml`, ficou responsável por verificar a `estilização do código`;
  3. Por fim adicionamos ao projeot o `commitlinting` que verifica se as mensagens de commit estão de acordo com o `Conventional Commit`.
  - Ainda, para verificar localmente linting da mensagem de commit foi adicionado o `Husky` + o hook `commit-msg` que não deixa passar mensagens fora do padrão;
  - `git commit --no-verify`

  ***

  ### DESAFIO : Adicione um Hook que verifique, antes de fazer um commit, **se foi inserido alguma SECRET_KEY** para um serviço importante.
  - Para a resolução do desafio utilizei os módulos `secretlint` e `secretlint-rule-preset-recommend`(adicionado json de configuração da lib);
  - Configurei um arquivo `.secretkeyignore` para previnir falsos positivos em diferentes contextos;
  - Depois adicionei na rotina de `pre-commit` o comando `npx secretlint "**/*"` que executa uma verificação dos arquivos do projeto.
    - Para melhorar o desempenho vou utilizar o `lint-staged` que **retorna para a verificação apenas os arquivos que estão em stage**;
    - Agora a rotina de `pre-commit` executa `npm lint-staged`.
  - Por fim, vou adicionar um `workflow` que executa o `npx secretlint "**/*"` para a validação também ocorrer no CI.

---

# Licença

- Existem diferentes tipos de licenças, cada uma com **regras**, proteções legais, próprias. A escolhida para o desenvolvimento do projeto foi a `MIT LICENCE`,
  que é **dominante** no mundo de desenvolvimento open-source.

---

# Etapa de Manutenção (intalando novas versões dos módulos)

- **Semantic Versioning**
  - estrutura formada por três número separados por pontos: `major.minor.patch`
    - `patch`: praticamente nenhuma diferênciação para o consumidor final, **sem** BREAKING CHANGES;
    - `minor`: adiona um novo recurso, **sem** BREAKING CHANGES;
    - `major`: alguma coisa na API pública mudou, **com** BREAKING CHANGE.

  ```json
  /*
  package.json
    - Caso não exista um `package-lock.jsos`
  */

  "next": "13.1.6" => instala a exata versão,
  "next": "^13.1.6" => dá ao npm a autonomia para instalar outras versões com `minor` e `patch` diferente,
  "next": "~13.1.6" => dá ao npm a autonomia para instalar outras versões, apenas, com `patch` diferente
  ```

- `npm outdated` para verificar módulos desatualizados;

- Vamos atualizar as depedências de forma **interativa** com o comando `npx npm-check-updates -i` que instala e roda esse módulo temporariamente;

- `Peer Dependecies` ou `Shared Dependencies`: é muito comum que módulos tenha dependências compartilhadas, ou seja, duas ou + bibliotecas utilizam um mesmo módulo internamente; Para economizar processamento o node.js tenta organizar as dependências de forma hierárquica com uma árvore de dependências, assim esse pares utilizam uma única instalação; Isso pode causar um conflito quanto das versões aceitas por cada módulo:

```bash
npm error Conflicting peer dependency: @typescript-eslint/parser@8.51.0
---
npm error node_modules/@typescript-eslint/parser
npm error   peer @typescript-eslint/parser@"^8.51.0" from @typescript-eslint/eslint-plugin@8.51.0
---
npm error   node_modules/@typescript-eslint/eslint-plugin
npm error     peerOptional @typescript-eslint/eslint-plugin@"^6.0.0 || ^7.0.0 || ^8.0.0" from eslint-plugin-jest@28.8.0
---
```

- O módulo `eslint-puglin` solicita o parser instalado na versão _"^8.51.0"_, mas o `eslint-plugin-jest` quer alguma dessas versões: _"^6.0.0 || ^7.0.0 || ^8.0.0"_ e, verificando no `package-lock.json`, ele está instalado na versão _"7.2.0"_; Por fim, para resolver o problema, basta atualizar essa dependência;
  - Não é uma boa prática deixar um pacote desse tipo instalado na raiz do projeto, vamos desinstala-lo com o `npm uninstall @typescript-eslint/parser`; e, para resolver o problema de outra forma: `rm -rf package-lock.json` e reinstalar tudo novamente: `npm i`;

---

# Meus alias

```bash
[alias]

	# Status
	st = status
	s = status -sb

	# Navegação
	ck = checkout
	br = branch
	recent = branch --sort=-committerdate

	# Commits
	cm = commit -m
	ac = !git add -A && git commit -m
	wip = !git add -A && git commit -m 'WIP'

	# Amend
	ca = commit --amend
	cane = commit -a --amend --no-edit

	# Desfazer
	undo = reset HEAD~1 --soft
	unstage = reset HEAD --

	# Logs
	lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
	lol = log --oneline --graph --decorate --all
	last = log -1 HEAD
	ls = log --pretty=format:'%C(yellow)%h %C(blue)%ad%C(red)%d %C(reset)%s%C(green) [%cn]' --decorate --date=short

	# Diffs
	df = diff
	dfc = diff --cached

	# Sincronização
	pushf = push --force-with-lease
	up = pull --rebase --autostash
```

---
