## Mentalidade

- **Faça do desenvolvimento uma jornada prazerosa e que, ao final, impacte alguém.**
- **Experimente fazer dos acontecimentos da sua vida um curso, um momento de aprendizado - levando a vida de forma mais leve e com perpectiva de evolução.**
- **Tecnologia x Negócios: é difícil, mas devemos ter perpectiva dessas duas torres. Essa ampla visão, no contexto de uma empresa, permite resolver problemas de forma mais efetiva e menos conflitosa _pensando no impacto que o sistema fará_!**
- **Tome cuidado quando alguém disser que algo que você faz é um lixo, pois para aquela pessoa realmente pode ser, mas tenha orgulho da sua evolução. Não espere validação das pessoas.**
- Sinta-se confortável com problemas, não existe atalhos para adquirir esse conforto somente experiência e tempo são necessários.
- Código não é esculpido em pedra, a flexibilidade de um código é um fator de qualidade extremamente importante - desenvolvimento orgânico.

---

## Git - Content-Addressable Object Database

- Sistema centralizado x Sistema distribuído.
  - centralizado: a cópia principal está no servidor e as pessoas _reservam_
    um arquivo para ser alterado, impedindo outros desenvolvedores de acessarem antes de um _checkout_ ser feito.
  - distribuído: cada desenvolvedor tem uma cópia do seu projeto na sua máquina, também resolve problemas de merge.

### Objetos git

- `Commit (Compromisso)`
  - Objetos imutáveis, formados por metadados e identificadores (hash) para a tree raiz e o commit anterior (pai); grava o **estado do projeto** permanentemente.

- `Blobs (Binary Large Object)`
  - **Conteúdo bruto** de um arquivo compactado em bytes.

- `Trees`:
  - Árvore de identificadores para BLOBs e outras subtrees; representando o **diretório** como um todo.

- `TAGs`
- Objeto que referência permanentemente um commit; utilizado para marcar **versões**.

### Estágios

0. Untracked: o git ainda não está monitorando aquele arquivo.
1. Modified: um arquivo já salvo pelo git está modificado.
2. Staged: área de preparo, será salvo pelo commit.
3. Commit: Cria-se uma snapshot _imutável_ com as alterações consolidadas (Uma árvore de blobs + metadados).

### Como realmente funciona o git?

- O git não salva a diferença entre os arquivos, nem muito menos cópias completas. Na verdade, ele só salva snapshots de arquivos que foram realmente modificados!
  - Ao calcular um hash do conteúdo, se tiver o mesmo valor: o arquivo não mudou, logo o ponteiro deve continuar apontando para a versão já salva;
  - Se mudou o ponteiro salva o BLOB desse arquivo no banco e a árvore passará a apontar para o hash desse blob.

- Comandos
  - git status: mudanças desde o último commit, branch atual.
  - git add
  - git log --oneline
  - git diff
  - git commit --amend (emenda o commit anterior, criando um novo, com outro hash)
    - Ao dar push, resultou no error: `! [rejected] non-fast-forward`, pois o commit reescrito já estava no github.
      opções: merge, rebase, fast-forward only:
    - _pull --merge_ (igual ao git pull padrão): tenta mesclar os commits.
    - _pull --rebase_: aplica os commits locais por cima dos commits remotos.
    - _push --force-with-lease_: push --force com segurança, sem apagar commits mais recente, protegendo o trabalho das outras pessoas.
      se o commit do diretório remoto for igual ao do local, ele faz o push, se não ele é cancelado.
    - _push --ff-only_: branch local está apenas avançando o ponteiro do branch remoto, sem remover, substituir ou reordenar commits, assim ele só muda o ponteiro para frente. **Só é possível se nenhum trabalho ser perdido**.
  - **git commit -am 'add `...`' - adiciona as alterações na stagearea, adiciona o comentário e commita.**
  - git mv atual_name new_name
    - Renomeia o arquivo do sistema;
    - Remove o arquivo antigo do git;
    - Adiciona o novo arquivo no stage area.

  - git branch: lista todas as branchs do sistema.
    - git branch branch-name : cria uma nova branch;
    - git checkout branch-name: altera a vizualização do projeto para branch criada.

---

### Branches

- Nível 1: o comando `git branch branch-name` cria uma cópia do projeto, onde é possível altera-la sem modificar a cópia original;

- Nível 2: os arquivos não são duplicados, a mudança de linhas do tempo ocorre pelo apontamento do commits. Ou seja, se você cria uma nova branch os commits do passado serão iguais aos da branch main, mas os commits do futuro somente pertencerão a nova branch;

- **Nível 3**:
  - uma branch é um objeto que aponta para um commit, assim _o nome de uma branch pode ser visto como um apelido para um commit_;
  - o ponteiro HEAD aponta para o objeto branch, que aponta para o objeto do commit;
  - `nada é duplicado, apenas ponteiros são movidos para diferentes commits`;
  - por fim, o git checkout, ou o git switch, pode ser um comando apenas para trocar o apontamento do HEAD para diferentes commits.

### Estratégias de branching

- **Trunk-based Development (desenvolvimento baseado em tronco)**  
  Nesse modelo, todo o time trabalha a partir de uma única branch principal, normalmente chamada de `main` ou `trunk`. As alterações são pequenas, frequentes e integradas rapidamente.  
  O objetivo é evitar divergências grandes de código e facilitar a integração contínua (CI).

- **Feature Branch (GitHub Flow)**  
  Para cada mudança no sistema — seja um novo recurso ou a correção de um bug — é criada uma branch separada a partir da `main`.  
  Quando o desenvolvimento termina, a branch é revisada e integrada de volta à branch principal.
  - **Pull Request (PR)**  
    É o mecanismo usado para solicitar a revisão do código. Permite comentários, validações automáticas (testes) e aprovação antes do merge, aumentando a qualidade e a segurança das alterações.

- **Git Flow**  
  Estratégia mais complexa, considerada hoje como legado em muitos projetos.  
  Utiliza várias branches fixas, como `develop`, `release`, `hotfix` e `main`, sendo indicada para projetos que precisam manter múltiplas versões em produção ao mesmo tempo.  
  Apesar de organizada, pode gerar mais burocracia e atrasar entregas.

- **Trunk-based Development com Feature Flags**  
  Variação do Trunk-based Development onde funcionalidades novas são integradas diretamente na `main`, mas ficam desativadas por meio de _feature flags_.  
  Isso permite publicar código incompleto sem impactar os usuários finais, ativando ou desativando funcionalidades de forma controlada e segura.
  - Existem várias outras trunk-based development com diferentes features.

---

### Como nunca perder seu código com o git - Apagando Branches.

- Como deletar branches? `git branch -d branch-name` ou `git branch -D branch-name` para forçar a operação, caso o git solicite um merge;

- Commits apagados podem ser chamados de `dangling commits` ou `unreachable commits`. Por que dangling/unreachable? pois não são alcançáveis por nenhuma referência ativa, ou seja, nenhum commit ou objeto aponta para ele;

- Ao deletar uma branch, o git retorna o **hash do último commit** apontado por esse objeto. Caso essa mensagem seja perdida, é possível recuperar utilizando: `git reflog`, e alguns outros (`log --graph --oneline --decorate --all --reflog`, etc);

- `reflog (reference log)` mantém um registro local das alterações das referências do Git (por padrão, HEAD ou branches e tags);

- **CUIDADO**: dangling commits não ficam salvos para sempre. Após deixarem de aparecer no reflog (geralmente ~30 dias), eles podem ser removidos pelo garbage collector (`git gc`).

- É possível definir um alias com git! Portanto, é possível fazer `git lg` = `log --graph --oneline --decorate --all --reflog`;
  - ```bash
    git config --global alias.lg \
    "log --graph --oneline --decorate --all --reflog"
    ```

- Por fim, para **restaurar** uma branch basta fazer `git checkout -b <branch-name> <commit-hash> `.

---

### Merge

- `git checkout <souce-HEAD>` -> `git merge <target-HEAD>`;
- `fast-forward` (avanço rápido): apenas atualiza a referência da branch para o _target commit_;
- `3-way merge` (mesclagem de três vidas): quando há divergência de conteúdo é necessário resolve-las e commitar a nova referência;

---

### Commits - Boas práticas

1. Commits bem feitos fazem diferença? **Desmanchando o medo**: `mensagens de commits não são tão importantes assim; mas quando se quer conseguir uma vaga`; para executar um desafio técnico ou contribuir em um projeto open source é necessário saber utilizar a tecnologia para avançar mais rápido. `Calcule o saldo`, gaste energia para implementar algo que avance o desenvolvimento e não coloque assuntos triviais em um pedestal.

- **Fazer muito com pouco, não pouco com muito** - abstrair problemas diminui a complexidade e aumenta a motivação.

2. Como definir o escopo de um commmit - boas práticas: `separe cada mudança lógica em um commit separado`; O que seria uma **mudança/divisória lógica**? é necessário um treinamento mental para definir essa mudança, mas aqui vão alguns exemplos:

- diferenciação de ambientes (código, documentação),
- intenção (performace, feature),
- implementação **(contrução da feature, correção de consequências da implementação, testes)**,

- _Princípios_:
  - > Cada commit precisa ser justificado por seus próprios méritos. Ou seja, o escopo de uma alteração precisa ter início, meio e fim.
  - > Um commit atual não pode depender de um commit futuro, são pequenos passos para resolver um problema (desenvolvimento orgânico); um commit futuro pode depender de um commit do passado.
- _HACK - se faça essa pergunta_: `se esse commit precisar ser desfeito, eu gostaria de desfazer tudo que está nele?`
- **E os testes automatizados, devo fazer um commit para a implementação da ferature e outro para os testes?** A construção dessas duas funcionalidade justificam seus próprios méritos (as duas tem começo, meio e fim), mas eles ainda tem uma correlação de parentesco, onde os dois andam juntos. Dito isso, em contexto de TDD a melhor escolha seria unificar os commits (feature + tests).

3. Como definir uma mensagem de commit: em um contexto profissional é necessário seguir padrões para commits. Dito isso, adiciono mais algumas regras e HACKS ao conhecimentos já adquiridos:

- **Convênções**:
  - Tempo-modo verbal: **presente-imperativo**;
  - Não comece com letra maiúscula, todo o texto deve estar em letras minúsculas;
  - Não finalize com ponto final;

- **HACK - se faça essa pergunta**: `O que esse commit faz (se ele for mesclado na branch main)? Para que ele serve?`
  - 'Adiciona um `botão maior` na interface'.
  - 'adds a `large bottom` in interface.'
- **Português ou inglês?** Pela necessidade de prática, escrever as mensagens em inglês é,pessoalmente, melhor.

---

### Commitlint

- `Conventional commits`: especificação que permite humanos e máquinas entenderem melhor as mensagens de um commit.
  - A mensagem de commit deve ser estruturada seguindo:

  ```txt
    <type>[optional scope]: <description>

    [optional body]

    [optional footer(s)]
  ```

  - type: determina a **intenção** do commit: `fix:`, `feat:`, `tests: `, `ci:`, `docs:`, `style:`, `revert:`, ...;
  - scope: informação adicional de contexto: `(api)`, `(interface)`, ...;
  - description: resumo **sucinto** da mudança (deve seguir as convênções definidas anteriormente);
  - body: Deve incluir a **motivação** para a mudança e **comparação** com o comportamento anterior;
  - footer: Deve conter informações sobre `BREAKING CHANGE` e, também, é o lugar para referênciar as `GitHub issues` que o commit resolve;

  - Documentação: https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines, https://www.conventionalcommits.org/en/v1.0.0/

---

### git reset && git rebase && git pull --rebase

- `git reset <commit-hash>`: redefine o HEAD atual para um commit anterior; existem alguns modos possíveis:
  - `--hard`: **descarta** todas as alterações;
  - `--soft`: **preserva e aplica** as alterações na estage area;
  - `--mixed`(padrão): as alterações são **apenas preservadas**, mas não são aplicadas na estage area.

  - `git rebase <branch-base>`: o git identificará o ponto de divergência e aplicará os novos commits (aqueles a frente da divergência) encima da nova base

- `git rebase --interactive <commit-hash>`(`-i`): após definir um commit base, permite reaplicar e modificar commits encima da base;

- `git pull --rebase`: busca as mudanças do repositório remoto e **reaplica os commits locais por cima**;
  - os commits remotos ficam como a base e os locais são aplicados encima deles:

    ```txt
    Antes:
    A---B--C (origin/main)
        \
          D---E (seu local)

    Depois do rebase:
    A---B---C (origin/main atualizado)
            \
              D'---E' (seus commits reaplicados)
    ```

---
