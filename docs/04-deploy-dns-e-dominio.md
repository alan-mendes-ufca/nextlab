## Deploy

- modelo mental _cliente-protocolo(forma de comunicação)-servidor_
- Hospedar: ...
- Fluxo de deploy:
  _Desenvolvedor - github - C.I. - Biuld - Servidor- Cliente._
- Versel.

---

## Orgânico x Impressora 3D

- A forma como a vida é formada: uma célula se multiplica, orgãos são formados e desenvolvem-se até o momento do nascimento.
- Algo impresso de forma automática, sem características artesanais.

---

## Organização de tarefas

- _Fazer muito com pouco_ e **não** _fazer pouco com muito_ - calcular o saldo.
- Níveis de organização de tarefa (gasto energético perceptiv)
  - Nível 1 (baixo saldo energéco): Ser lembrado individualmente - anotar as tarefas em um papel e deixar perto de você.
  - Nível 2 (baixo ''): Ser lembrado em grupo - marcar o progresso.
  - Nível 3 (médio ''): Expandir conhecimento.
  - Nível 4 (muito alto ''): Gerar métricas e mensurar o progresso das pessoas.
- Pouco para muito > muito para pouco.
  - Trabalhar pouco para muita recompensa.
  - ABSTRAIR PROBLEMAS DIMINUI A COMPLEXIDADE E AUMENTA A MOTIVAÇÃO.

# Como fazer seus projetos darem certo?

o sucesso de projetos pessoais baseam-se em dois pilares: moral x técnica.

- moral: ter uma autoestima alinhada, saber que você é capaz de fazer o que é necessário.
- técnica: estudar e aplicar seus conhecimentos técnicos em projetos, compartilhá-los e valorizar feedbacks.

# Milestones e Issues (Marcos e questões)

- Ferramenta do github para abstrair problemas e facilitar o desenvolvimento.

---

# Padronizar código

- Todo mundo tem seu jeito de escrever e, inclusive, de codar, um impressão digital nas linhas dos códigos. Entretanto, estilizar código auxilia no entendimento das outras pessoas e outro contrinbuintes, fazer essa operação logo no início do projeto evitará problemas futuros!
- Existem dois tipos de _formatadores de código_: os **Pré** formatadores e os **Pós** formatadores.
- **Pré**: formatam enquanto digitamos o código:
  - `.editorconfig` (https://editorconfig.org/): adiciona regras de estilo ao editor para todos que estiverem trabalhando no projeto.

- **Pós**: aplica a estilização após salvar o código:
  - Prettier (formatador de código): `npm install prettrier -D`
    - adicionando um script no package.json:
      `"lint:check": "prettier --check .",`
      `"lint:fix": "prettier --write ."`

  - O prettier lê o `.editorconfig` e aplica _algumas_ das configurações definidar, lógico, aquelas que não entram em conflito com suas próprias configurações.

---

# DNS (Domain Name System)

- O que é um **domínio**???
  | Parte | Nome Técnico | O que é |
  | :--- | :--- | :--- |
  | **`www`** | Subdomínio | Define o serviço (o "World Wide Web" no caso). |
  | **`alan`** | Nome Registrado | A parte única que você escolheu. |
  | **`.com.br`** | Domínio de Nível Superior | A extensão geográfica e de categoria. |
  | **`alan.com.br`** | Domínio | A identidade central do seu site. |
  | **`www.alan.com.br`** | Endereço (ou Hostname) | O endereço completo para acessar o recurso. |

- Round 1
  - Computadores só se conectam entre si por meio de Ips.
  - DNS seria um grande banco de dados (`servidor dedicado somente para guardar emails`) que armazena o nome do site e, em outra coluna, o ip do servidor desse site.

- Round 2
  - `Recursive Resolver`(Ferramenta de pesquisa do DNS) -> `root servers` (Aponta para os servidores do domínio mais alto: `.com.br`, por exemplo)-> `Top level domain` (Aponta para o servidor realmente detém o domínio) -> `Authoritative Server`(Fonte): retorna o Ip do _Hostname_ buscado.
  - Diagrama:

```
+---------------------+
|Dispositivo de cliente|
+----------+----------+
          | 1. Pergunta: Qual o IP de exemplo.com.br?
          v
+---------------------+
| **Recursive Resolver**|
| -Busca de servidor    |
|     em servidor       |
+----------+----------+
          | 2. Pergunta: Quem sabe sobre ".br"?
          v
+---------------------+
| **Root Server** ( . )|
+----------+----------+
          | 3. Resposta: Consulte o TLD ".br"
          v
+---------------------+
| **TLD Server** (.br) |
+----------+----------+
          | 4. Pergunta: Quem é o Authoritative Server que guarda "exemplo.com.br"?
          v
+---------------------+
| **Authoritative** |
| **Server** (exemplo.com.br)|
+----------+----------+
          | 5. Resposta: O IP é 203.0.113.42 (Exemplo)
          v
+---------------------+
|**Recursive Resolver**|
+----------+----------+
          | 6. Resposta Final: O IP é 203.0.113.42
          v
+---------------------+
| Dispositivo Cliente |
+---------------------+
```

- Fully Qualified Domain Name (FQDN): os domínio que usamos diariamente são apenas abreviações como: tabnews.com.br,
  a versão completa seria: tabnews.com.br`.` (root domain).

- Para acelerar essa buscar temos o **Time To Live (TTL)**: o ip de sites acessados frequentemente ficam salvos no navegador, econômizando tempo de busca nesse ciclo.

# Como **RESGISTAR** um domínio `.com.br`.

- Como se inserir no bando de dados de um TLD (Top Domain Level)?
  - Operadoras de domínios: hostgator.com, registro.br, etc.
  - nic.br -> registro de todos os domínios do Brasil.

---

# O surguimento do `nextlab`

- Enquanto estudava sobre a criação de domínios, me veio na cabeça: "Como eu vou resgitar um domínio sem saber o que eu quero construir?". Bom, eu sabia que o que fosse criado precisaria gerar valor, um local de pessoas com perfil inovador, acolhedor e construtivo. Algo que tenha ligação com a faculdade e com os cursos de tecnologia, que represente união e que seja construtivo para todos (conhecimento e networking). Talvez algo que ligue pessoas de todos os cursos de tecnologia da UFCA e gere uma união para o desenvolvimento de projetos, um `mostruário de trabalhos, um hub de tecnologia: nextlab (nextlab.tec.br)`.
- O que é um hub? `Um hub é um ponto de conexão, o objetivo é criar uma comunidade viva, onde: estudantes da UFCA se conectam, aprendem e criam sistemas juntos`.
- Como fazer isso? Criando uma `estrutura de rede social simples`.

## Estrutura básica:

- Perfis individuais:
  - nome + curso + habilidades;
  - redes sociais;
  - `score de contribuição (inovation-coins 😂) para cada contruibuição open source ou ligação com projetos.`

- Páginas de projeto:
  - pequena descrição;
  - link do github;
  - contato dos responsáveis pelo sistema;
  - integração com API do github: `tarefas abertas: issues`.

- Equipes (snake_case, pet_core, topiket, etc)
  - `Desenvolvimento temático`: jogos, desenvolvimento web, dados, aplicativos, pesquisa, etc.
    Isso permite que novos ingressantes tentem se aproximar da sua área de interesse.

## Como organizar o conteúdo do site?

- Uma página principal com projetos destaque.
- Outra com grupos e suas respectivas áreas de estudo.
- Área de projetos recentes para que novatos não fiquem _escondidos_.

## Como desenvolver um ambiente realmente colaborativo?

- `Criar um estatuto simples da plataforma: "Estamos nesse exato momento contruindo um novo local na internet para quem têm interesse em tecnologia e quer criar maturidade no assunto, vamos nos conectar e contruir projetos de valor concreto para nossa carreira e futuro da comunidade tec da UFCA."`
- Criar um discord, telegram do nextlab.

---
