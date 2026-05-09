# Sistema de logs do backend

Esta issue nasceu de uma necessidade bem prática: conseguir observar melhor o backend depois que a aplicação está rodando fora da máquina local.

Os logs disponíveis em plataformas como a Vercel ajudam no começo, mas possuem limitações importantes para um projeto em crescimento: retenção curta, busca limitada e pouca flexibilidade para correlacionar eventos. Na prática, isso dificulta entender erros em produção, acompanhar comportamentos recorrentes e investigar falhas que não acontecem facilmente em desenvolvimento.

A solução implementada buscou um equilíbrio: simples o suficiente para não virar uma plataforma de observabilidade complexa, mas útil o bastante para deixar rastros persistentes e consultáveis.

---

## Estratégia escolhida

A decisão foi implementar um logger estruturado, persistindo os logs no Postgres em formato JSON.

Essa escolha fez sentido porque:

- arquivos não são confiáveis em ambientes serverless;
- serviços externos como Datadog seriam exagerados para o estágio atual;
- o banco já fazia parte da infraestrutura do projeto;
- o Postgres oferece retenção e consulta posterior via SQL;
- campos `jsonb` permitem guardar metadados flexíveis sem engessar demais o schema.

O aprendizado principal aqui foi entender que observabilidade básica não precisa começar por uma ferramenta grande. Muitas vezes, um modelo simples, persistente e bem padronizado já resolve a maior dor: saber o que aconteceu, quando aconteceu e em qual contexto.

---

## Modelagem dos logs

Os logs passaram a ser armazenados na tabela `application_logs`.

Cada registro representa um evento ocorrido no backend, não necessariamente uma requisição inteira. Por isso, uma mesma requisição pode gerar mais de um log.

Campos importantes:

| Campo         | Aprendizado                                                    |
| ------------- | -------------------------------------------------------------- |
| `id`          | Identifica o registro específico do log.                       |
| `level`       | Define a gravidade do evento, como `info`, `warn` ou `error`.  |
| `event`       | Nomeia o que aconteceu no sistema.                             |
| `message`     | Mensagem legível para facilitar investigação.                  |
| `metadata`    | Guarda detalhes técnicos, como nome, mensagem e stack de erro. |
| `user_id`     | Associa o evento a um usuário, quando existir.                 |
| `request_id`  | Correlaciona logs gerados pela mesma requisição.               |
| `method`      | Método HTTP usado na requisição.                               |
| `path`        | Rota acessada.                                                 |
| `status_code` | Status HTTP resultante.                                        |
| `created_at`  | Momento em que o log foi persistido.                           |

Também ficou claro que `TEXT` é uma boa escolha para campos como `event`, `message`, `method` e `path`, porque no Postgres não há vantagem prática em usar `VARCHAR(n)` quando não existe um limite real de negócio para o tamanho do texto.

Para o `level`, a tabela usa uma restrição para aceitar apenas valores conhecidos:

```sql
level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error'))
```

Isso mantém a flexibilidade do `TEXT`, mas evita que valores inválidos sejam persistidos.

---

## `id` e `request_id`

Um dos aprendizados mais importantes foi separar claramente o papel de `id` e `request_id`.

O `id` pertence ao registro do log. Ele é gerado pelo banco e identifica uma linha específica da tabela.

O `request_id` pertence à requisição. Ele é gerado no backend, no middleware, e acompanha o fluxo daquela chamada.

```txt
Request chega
↓
middleware gera request_id
↓
handlers e validações executam
↓
logger persiste eventos com o mesmo request_id
↓
investigação futura consegue correlacionar os logs
```

Essa diferença muda a forma de pensar logs. O objetivo não é apenas armazenar linhas no banco, mas criar uma trilha de eventos que permita reconstruir o caminho de uma requisição.

---

## Middleware de log

O `controller.logRequest` foi implementado como uma middleware factory.

Isso significa que a função externa recebe configurações, como `event` e `message`, e retorna o middleware real que será executado durante a requisição.

```javascript
function logRequest(event, message) {
  return async function log(request, response, next) {
    return next();
  };
}
```

Esse formato permite declarar logs de forma expressiva nas rotas:

```javascript
controller.logRequest("user.created", "Usuário criado com sucesso.");
```

O aprendizado aqui foi perceber que `logRequest("user.created", "...")` roda no momento em que a rota é configurada, mas o retorno dela é o middleware que será executado depois, em cada requisição.

Por isso, a função externa não deve ser `async`. Se fosse, ela retornaria uma `Promise` em vez de retornar diretamente o middleware esperado pelo `next-connect`.

---

## `response.on("finish")`

Outro ponto importante foi usar o evento `finish` da resposta.

O middleware prepara o contexto da requisição, registra um listener e chama `next()`. O log de sucesso só é persistido depois que a resposta termina.

```txt
middleware registra response.on("finish")
↓
middleware chama next()
↓
handler executa a regra de negócio
↓
response é enviada
↓
finish dispara
↓
log é salvo com status_code final
```

Esse fluxo é importante porque o status da resposta ainda pode mudar durante os próximos middlewares ou handlers. Ao esperar o `finish`, o logger consegue registrar o `status_code` real que foi enviado ao cliente.

Mesmo quando a resposta termina com erro, esse log contextual continua sendo persistido. Assim, quem investiga uma requisição pelo `request_id` consegue ver qual endpoint estava sendo executado e qual era a intenção da operação, além do log técnico do erro registrado pelo handler central.

---

## Error handler central

Os erros passaram a ser registrados automaticamente no `onError` do controller.

Isso evita depender de cada rota para lembrar de logar suas falhas. Qualquer erro que chega ao handler central pode virar um registro persistente em `application_logs`.

A classificação ficou baseada no tipo e no status do erro:

| Situação               | Evento                  | Nível   |
| ---------------------- | ----------------------- | ------- |
| Erro de validação      | `validation.failed`     | `warn`  |
| Falha de autenticação  | `authentication.failed` | `warn`  |
| Falha de autorização   | `authorization.failed`  | `warn`  |
| Recurso não encontrado | `resource.not_found`    | `info`  |
| Erro inesperado        | `request.failed`        | `error` |

Esse desenho ajuda a separar erro esperado de erro crítico. Um `404`, por exemplo, pode ser útil para análise, mas não precisa ter o mesmo peso de uma exception inesperada.

Quando uma requisição estoura erro, a mesma `request_id` passa a correlacionar dois registros:

- o log contextual do endpoint, registrado pelo `response.on("finish")`;
- o log técnico do erro, registrado pelo `onError`.

Essa duplicidade é intencional. O primeiro log responde “qual operação estava acontecendo?”, enquanto o segundo responde “por que ela falhou?”.

---

## Eventos granulares

O campo `event` se mostrou mais útil quando segue o padrão:

```txt
<recurso>.<ação>
```

Exemplos:

```txt
user.created
user.updated
session.created
session.deleted
migrations.listed
migrations.executed
validation.failed
authentication.failed
authorization.failed
```

Eventos genéricos como `error`, `success` ou `request` não explicam bem o que aconteceu. Já eventos granulares facilitam busca, agregação e investigação posterior.

O aprendizado aqui foi que logs são uma interface de leitura do sistema. Se os nomes dos eventos forem ruins, a investigação também fica ruim.

---

## Testes do logging

Os testes precisaram considerar um detalhe assíncrono: logs de sucesso são salvos dentro de `response.on("finish")`.

Isso significa que o `fetch` pode receber a resposta antes de o `INSERT` do log terminar. Para evitar falso negativo, os testes usam `async-retry` ao buscar o log pelo `request_id`.

```javascript
return retry(async () => {
  const requestLogs = await logger.findApplicationLogsByRequestId(requestId);
  if (requestLogs.length !== expectedCount) {
    throw new Error("Application logs were not persisted yet.");
  }

  return requestLogs;
});
```

Esse ponto reforçou uma diferença importante entre testar a resposta HTTP e testar efeitos colaterais assíncronos. A resposta pode estar correta, mas o efeito posterior ainda pode estar em andamento por alguns milissegundos.

Nos cenários de erro, os testes validam exatamente dois registros com a mesma `request_id`: um log `info` contextual do endpoint e outro log técnico com o evento de falha, como `validation.failed` ou `authorization.failed`.

---

## Conclusão

A issue entregou uma base simples de observabilidade para o backend:

- logs persistidos no Postgres;
- estrutura padronizada;
- eventos nomeados de forma granular;
- erros capturados automaticamente;
- requisições importantes registradas;
- correlação por `request_id`;
- dois logs correlacionados para requisições com erro;
- testes cobrindo sucesso, validação, autenticação, autorização e rotas ignoradas.

O maior aprendizado foi perceber que logging não é apenas `console.log` com outro destino. Um bom log precisa de contexto, consistência e intenção. Quando cada evento responde claramente “o que aconteceu?”, “onde aconteceu?”, “com quem aconteceu?” e “qual foi o resultado?”, o sistema fica muito mais fácil de operar.
