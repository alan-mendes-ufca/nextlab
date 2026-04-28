## Protocolos

- HTTP: Hypertext Transfer Protocol
  - Como informações web vão ser trocadas entre cliente-servido: requisições e respostas.
  - Como servidores com vistual hosts, ou seja, que servem várias aplicações sabem qual API retornar? Basicamente, no cabeçalho http, o usuário/navegador define o `host` que se quer ser acessado.
- FTP: File Transfer Protocol
- SMTP: Simple Main Transfer Protocol
- TCP: Transfer Control Protol
  - Confirma o recebimento dos pacotes, garantindo sua integridade (+ segurança).
- IP: Internet Protocol
  - Identificador básico de todos os nós da rede.
- UDP: User Datagram Protocol
  - Diferentemente do TCP, o UDP _não_ assegura a transformação
  - _interpolação para compensar a perda de pacotes_
  - Utilizado em chamadas, jogos.

---

## next.js

- File Base Rounting
  - O Next.js utiliza um sistema de arquivos (/app ou /pages) para definir rotas automaticamente.
  - Cada arquivo dentro da pasta representa uma rota no aplicativo.
  - Exemplo(utilizando a pasta pages):

    ```
    pages/
    ├── index.js         →  /
    ├── about.js         →  /about
    └── blog/
        └── [id].js      →  /blog/:id
    ```

  - Em versões mais recentes (Next.js 13+), recomenda-se usar o diretório **`/app`**:
    ```
    app/
    ├── page.js          →  /
    ├── about/
    │   └── page.js      →  /about
    └── blog/
        └── [id]/
            └── page.js  →  /blog/:id
    ```

---
