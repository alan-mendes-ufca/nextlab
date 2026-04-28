## Configurando projeto

### Entendendo nvm

- nvm (Node version maneger)
- nvm ls (Lista as versões do node disponíveis)
- nvm --help (Lista os comandos disponíveis)

### Mudando a versão atual do node:

- nvm install lts/hydrogen
- nvm alias default lts/hydrogen (nvm apelido padrão lst/hydrogen)

### Tecnologias Utilizadas

- Node.js (fundação) -> Next.js (paredes) -> React.js (móveis)

#### Instalando Tecnologias

- .nvmrc (Node Version Manager Run Commands)
- nvm install (Reconhece o arquivo .nvmrc e instala a versão recomendada para rodar a projeto)
- **npm** (node package maneger)
- npm init (Cria um package.json para definir os requirements do projeto)
- npm install next@13.1.5 (@some.version)
- npm install react@18.2.0 (@some.version)
- npm install react-dom@18.2.0

#### next dev (comando next que executa o projeto)

- o comando resultará um erro pois, no package.json o next é instalado de forma local.
- Para executar o comando é necessário adiciona-lo no objeto "scripts" de package.json.
- O comando vai ser executado através do script de package.json, com o comando _npm run dev_.

##### terminal:

- Rodando _npm run dev_.
  > Mensagem de erro: ready - started server on 0.0.0.0:3000, url: http://localhost:3000 , error - Project directory could not be found, restart Next.js in your new directory
  > O servidor levanta, mas cai em seguida pois não existe nenhum conteúdo para ser carregado.

---
