# Como armazenar senhas?

- Nível 5
  - Armazenar a senha em `texto puro`, totalmente exposta

- Nível 4
  - A senha passa por um algoritmo de `encriptação` e é salva no banco de dados

- Nível 3
  - One Way-Function: não é possível recuperar as informações originais
  - Hash PURO: identificador determinístico (identificadores únicos são gerados e pela singularidade determinam um dado).
    - MD5: criptograficamento quebrado e inadequado para uso futuro
    - SHA-1: utilizado pelo git, mais completo que o MD5; entretando, já depreciado
    - SHA-256: maior que o SHA-1 (40 caracteres x 64), amplamente utilizado atualmente

- Nível 2
  - `Hash + Salt`
  - `HashFinal = bcrypt(password)`
    - O `Salt` é um valor randômico, gerado por meio da senha, que fica armazenado no banco de dados para futuras validações
    - Sem o salt, duas senhas iguais de diferentes usuário teriam o mesmo hash

  - `Bcrypt`: os algoritmos anteriores são projetados para serem gerados o mais rápido possível (1ms); o Bcript, por meio da propiedade ROUND, consegue embaralhar a senha mais vezes, por mais tempo.
    - **Utilizado especificamente para armazenar senhas**
    - Já inclui o salt no HASH gerado, com isso não precisa armazena-lo no banco
    - A cada ROUD, o custo aumenta de forma exponencial; necessita de um balanceamento
    - **Ainda, o Bcrypt gera o identificador concatenando sua versão, o número de rounds, o salt e o hash (separados por $)**
    - Todos esses fatores contibuem no aumento do custo de processamento pro hacker

- Nível 1
  - `Hash + Salt + Pepper`
  - `HashFinal = Bcrypt(password + pepper)`
  - `Pepper`, dado com alta entropia, concatenado a senha antes do salt.
    - Onde armazenar o pepper?
      - A melhor opção é guardar dentro de uma variável de ambiente

---

# Login

- `Autenticação` (_Quem está se autenticando?_)
- `Autorização` (_O que está autorizado a fazer?_)

- `Cookie`
  - `Set-Cookie`: cabeçalho http com dados que o navegador deve armazenar no `Cookie Jar`
  - Cookies sozinhos não resolvem problemas importantes:
    - a cada requisição o sistema precisa relogar o usuário (email e senha presentes no cookie durante requisições e respostas),
    - recalcular o hash da senha durante o login (consome bastante processamento)
    - dados visíveis (vulnerabilidade)

- `Session-based Authentication`
  - Ao autenticar-se, a API gera um `Opaque Session Token` que é _salvo no banco de dados (stateful)_ juntamente com sua **data de validade**. Assim, ao invés de informações sensíveis ficares salvos no cookie, apenas esse **sesson_id** estaria sendo transmitido. Outro problema resolvido é a necessidade de recalcular o hash múltiplas vezes.
  - Um problema referente a essa técnica seria o `Session hijacking (sequestro de sessão)`, realizado por meio de **engenharia social**; consiste em copiar os cookies de sessão sequestratos e hackear as contas do usuário.

- `JWT based authentication`
  - O _JSON Web Token_ consistem em um conjunto de dados encodados em `base64url`, esse identificador é formado por: um **hearder** (metadados) + **payload** + **assinatura** (garante integridade do token);
  - esse identificador é armazenado apenas no cookie, tornando essa configuração _stateless_;
    - `base64url`: ferramenta que codifica o código de máquina de um dado, seguindo esses passos:
      1. O binário de um dado é dividido em pedaços de 6 bit (2⁶ = 64), onde cada bit representa um numéro/chave na **tabela base64**
      2. Calcula-se o resultado concatenando os valores encontrados na tabela
    - **assinatura** =

    ```js
    const secretkey = process.env.JTW_SECRET_KEY;

    // sha-256
    const signature = hash(
      `${base64EncodedHeader}.${base64EncodedPayload}`,
      secretkey,
    );
    ```

---

## Serviço de Emails

- http://github.com/filipedeschamps/clone-tabnews/issues/39

### Como emails funcionam?

Passo a passo:

- Ao enviar um email, a aplicação o envia para o **servidor de saída (SMTP server)** do seu provedor, utilizando o protocolo SMTP (Simple Mail Transfer Protocol)
  - Exemplos de provedores: Gmail, Outlook, Yahoo, etc.

- O servidor SMTP do remetente consulta os registros DNS (especificamente o registro MX - Mail Exchange) para localizar o servidor de email do destinatário

- Após localizar, o servidor do remetente encaminha a mensagem para o servidor do destinatário, também utilizando SMTP

- O **servidor de entrada** do destinatário recebe e armazena a mensagem em uma caixa de correio

- Quando o destinatário abre seu cliente de email, a mensagem é recuperada usando protocolos como:
  - **IMAP** (Internet Message Access Protocol) - mantém emails no servidor, permitindo acesso de múltiplos dispositivos
  - **POP3** (Post Office Protocol) - geralmente baixa e remove emails do servidor

### SMTP na unha

```bash
@alan ➝ nextlab (local-mail) $ telnet localhost 1025
Trying ::1...
Connected to localhost.
Escape character is '^]'.
220 EventMachine SMTP Server
HELO alan
250 Ok EventMachine SMTP Server
MAIL FROM: <alan@gmail.com>
250 Ok
RCPT TO: <contato@nextlab.tec.br>
250 Ok
DATA:
354 Send it
Subject: Teste por Telnet

Rayane, se você me ama dá uma risadinha!
.
250 Message accepted
QUIT
221 Ok
Connection closed by foreign host.
```

---
