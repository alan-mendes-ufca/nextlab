# React

## Geral

- requisitos de instalação: `React` e `React DOM`
- `.jsx` -> `JavaScript XML`, permite escrever elementos html em JavaScript
- O React não permite retornar vários elementos separados, eles precisam estar aninhados em um elemento pai (`<div></div>` ou `<></>`)

## Componentes

- Aplicativos React são formados por componentes;
- **componentes** são partes da interface que possuem sua própria `aparência, funcionalidade e memória`, _essas partes vão de um pequeno botão até uma páguina inteira_;
  - são `funções javascript que retornam html`

  ```jsx
  export default function button() {
    return <buttom>Hello word</buttom>;
  }
  ```

  - `export default` especifica o componente raiz da páguina;

- `{ }` indicam que está sendo passado um **código javaScript**, não uma string literal

## Estilos

- `className` para definir uma classe css (`<img className="avatar" />`)
  - uma das formas de linkar a style sheet é utilizar uma **tag** `<link>` dentro do retorno
  - outra forma mais convênvional é apenas **importar** o arquivo `.css` dentro do `.jsx`
  - Também é possível utilizar o **atributo** `style`, geralmente utilizado quando o estilo depende de variáveis

## Renderização condicional

- o uso de condições pode ser feito normalmente com `if`, por `ternários`, dentro do jsx, e operadores lógicos (`&& e ||`)

## Renderizando listas

- `map()`
  - o `map()` é muito **semelhamente** ao `forEach()`: os dois iteram sob uma lista de forma mais semântica e chamam uma função para cada elemento.
  - Sua _diferença fundamental_ é dada pelo **retorno**:
    - `forEach()` retorna `undefined`
    - `map()` retorna uma nova lista com os dados modificados

## Respondendo a eventos

- funções de **event handler**(`onClick`, `onChange`, `onSubmit`, etc) podem ser declaradas dentro de componentes

## Hooks

- `import { useState } from 'react';`: adiciona a funcionalidade de **memória** ao componente
  - Ao utilizar um estado, será retornado o estado atual e uma função que permite atualiza-lo (`[algo, setAlgo]`)

## Datafetchin

- Convênvionalmente o React recomenta o uso de Datafetchins ao invés de fazer búscas com javaScript puro
- `SWR`
- Interfaces não podem utilizar `await`

---

# Rest API

- É um acrônimo apra `REpresentational State Tranfer Aplication Programming Interface`
- Um **estilo de arquitetura** para _sistemas distribuídos de hipermídia_ (imagens, texto, áudio e vídeo)
  - Word Wide Web e Intranets são exempos de sitemas distruídos de hipermídia. Ou seja, REST é `uma arquitetura que se diz respeito a meios de comunicação`.
- `Dados e funcionalidade = Recursos, acessados por meio de endpoints`

## REST x RESTful

- **REST**, como todas os outros estilos de arquitetura, tem seus próprios _princípios e restrições_. Uma interface se diz **REST API (ou RESTful)** quando satisfaz todos essas regras.

## Princípios e Restrições

- Por meio de suas regras, o REST promove o desenvolvimento de aplicações `simples, escaláveis e sem estado`.

1. **Uniform Interface** (Organização e Padronização)

- A interface de interação entre o cliente e o servidor deve ser conciênte e uniforme, seguindo 4 pilares:
  - _Identificação de recursos_: recursos devem ter endereços unícos (`api/v1/status`, sequências de substantivos, nunca utilizar verbos)
  - _Manipulação via representação_: o cliente nunca deve acessar o banco de dados diretamente, as manipulações devem feitas em um JSON e retornadas para o servidos aplicar o novo estado.
  - _Mensagens Autodescritivas_ (Metadados): requisições e respostas devem conter informações sobre _"Tudo ocorreu bem"? "O que é?" e "O que fazer?" com aqueles bits_.
  - _HATEOAS_: a API deve enviar links para os próximos passos.
    ```json
    {
      "id": 100,
      "saldo": 500.0,
      "_links": {
        "self": { "href": "/contas/100" },
        "depositar": { "href": "/contas/100/deposito" },
        "sacar": { "href": "/contas/100/saque" },
        "extrato": { "href": "/contas/100/extrato" }
      }
    }
    ```

2. Cliente e Servidor (Separação)

- **Separação de responsabilidades**
  - O cliente e o servidor devem ser **independêntes**, assim o código de ambos podem evoluir separadamente (lógico, sem causar mudanças na referência de dados).

- `Cliente: faz requisições, salva sessões e interpreta respostas.`
- `API/Servidor: processa requisições, faz validações de segurança, faz ponte entre o cliente e o banco de dados.`

3. Stateless (Escalabilidade)

- cada requisição deve ter informações completas para que o servidor possa executar a instrução.
- sessões não são armazenadar nos servidor, ele cumpre apenas o seu papel de

4. Cacheable (Performace)

- Metadados
- Respostas devem contem um cabeçalho que indique se aqueles dados devem ser salvos ou não.

5. Sistema em camadas (Segurança e escalabilidade)

- O cliente não precisa saber se está conectado ao servidor final ou a um intermediário (Load Balancer, Proxy de segurança, etc)

6. Código sob demanda (opcional)

- Scrips executáveis podem ser enviados do servidor para o cliente.
- Geralmente APIs REST modernas servem apenas dados (JSON).

---
