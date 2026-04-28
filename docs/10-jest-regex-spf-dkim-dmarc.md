# Correção: Erro de ESM no Jest com `node-pg-migrate`

> Essa trilha de conhecimento me ajudou também a identificar quando, ao atualizar a biblioteca, o mesmo erro acontecia. Por fim, ao identificar o motivo bastava adicionar o nome da lib ao regex de transformIgnorePatterns.

## Problema

Após atualizar o `node-pg-migrate`, todos os testes falharam com:

```
node_modules/node-pg-migrate/dist/bundle/index.js:2
import { glob } from "glob";
^^^^^^

SyntaxError: Cannot use import statement outside a module
```

## Causa

A nova versão do `node-pg-migrate` passou a usar ESM (`import`/`export`). O Jest, que roda em CommonJS, transpila os arquivos do projeto via SWC do `next/jest`, mas **ignora o `node_modules`** por padrão — então não conseguiu interpretar o código ESM da lib.

## Dificuldade extra

Passar `transformIgnorePatterns` direto na config do `next/jest` não funcionava, pois ele **sobrescreve silenciosamente** esse valor com o padrão interno dele.

```javascript
// ❌ Não funciona — next/jest sobrescreve o valor
const jestConfig = creatJestConfig({
  transformIgnorePatterns: ["/node_modules/(?!(node-pg-migrate|glob)/)"],
});

module.exports = jestConfig;
```

## Solução

Modificar o `transformIgnorePatterns` **depois** que o `next/jest` gera a config:

```javascript
module.exports = async () => {
  const config = await jestConfig();

  config.transformIgnorePatterns = [
    "/node_modules/(?!(node-pg-migrate|glob)/)",
  ];

  return config;
};
```

Isso cria uma exceção para que o Jest transpile apenas o `node-pg-migrate` e o `glob`, mantendo o resto do `node_modules` ignorado.

---

# Regex

![alt text](imgs/regex.png)

---

# O que realmente é SPF, DKIM e DMARC ?

- Um conjunto de configurações extremamente importante de se saber **ao configurar um serviço de email externo**. Protocolos de segurança que garantem confiabilidade numa troca de mensagens.

- SIMPLE MAIL TRANSFER PROTOCOL foi definido em 1982, em um RFC. Como parte dessa padronização temos a estrutura de um cabeçalho de email:

  ```txt
  MAIL FROM: ecd528cb-660b-4eda-8eac@servidor.com
  // Define um servidor técnico de retorno para um retorno de estado de um email, ainda definindo de forma granular qual mensagem/email aquele estado pertence por meio de um uuid

  // Conteúdo:
  FROM: Pessoa <pessoa@servidor.com>
  Subject: Assunto importante

  Olá, estou contatando ...

  ```

  - Essa primeira estrutura não garantia confiabilidade NENHUMA em relação a fraudes!

- `SPF (Sender Policy Framework)`: **Protege a origem** controlando quais servidores podem enviar um email declarando determinado domínio.
  - Além da mensagem, o servidor _inbound_ passa a receber, também, o IP do servidor que envia o email. Assim, utilizando os registros cadastrados em um DNS (que é público), obtem-se uma lista de IPs de servidores que possuem autorização para enviar emails. Exemplo de estrutura: `TXT v=spf1 (qualificadores)mecanismos ~all`

- `DKIM (DomainKeys Identified Mail)`: **Protege o conteúdo** garantindo que o conteúdo da mensagem não foi alterado durando o roteamento da mensagem. Utiliza uma assinatura criptográfica que evita o tampering do email.
  - **Par de chaves assimétricas**: o hash da mensagem é calculado e assinado por uma chave privada. Outra chave, pública, presente no DNS do domínio, é utilizada para verificar se a assinatura recebida foi produzida pela chave privada.

  - Nova formatação do cabeçalho:

  ```txt
  MAIL FROM: ecd528cb-660b-4eda-8eac@apple.com
  DKIM-Signature:
    d=apple.com // Domínio para busca DNS
    s=publickey1 // Identificador para a chave pública no DNS
    h=from:subject:to:date // Cabeçalhos que vão participar da assinatura
    bh=A9B2BF5B3A02C9451CE // Body Hash
    b=BE1898CF73A2F4E870D179B22AA39E // Assinatura

  FROM: Pessoa <pessoa@servidor.com>
  Subject: Assunto importante

  Olá, estou contatando ...

  ```

- `DMARC (Domain-based Message Authentication, Reporting and Conformance)`:
  - Garante que o domínio declarado no cabeçalho _FROM_, _MAIL FROM_ e _DKIM-Signature_ sejam iguais.
  - Envia relatórios diários com estatísticas agregadas para o detentor do domínio.
  - Define políticas sobre o que o servidor pode fazer durante uma situação crítica.

---
