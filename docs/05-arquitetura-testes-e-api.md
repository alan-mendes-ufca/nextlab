# Páguina de 'EM CONSTRUÇÃO'

- Teoria Mc Donalds: Uma ideia ruim gera ideias boas.
  (Vamos almoçar? Aonde? - Ninguém sabe. Mas surguiu uma ideia: Vamos no Mc donalds! Se for pra ir no Mc Donals é melhor a gente x, y ou z!)

# Não confie em serviços.

- Corrigindo, não confie que um serviço terá 100% de uptime, é pouco provável e quase impossível que isso aconteça.

---

# PoC vs MVP

- Métodos para evitar trabalho desnecessário e desperdício de tempo, buscar aprovação ou sugestões de direção para um produto que não foi desenvolvido completamente.
- `Formas baratas de confirmar que o que você acredita está certo, após isso encarar o mínimo necessário para que o mundo atribua valor.`
- Proof of Concept (Prova de conceito)
  - Esclarecer para qual caminho, ângulo remar com o projeto.
- Minimum Viable Product (Produto mínimo viável)
  - Fazer o mínimo bem feito, fazer as features básicas e necessárias do sistema.

---

# Proposta de arquitetura e pastas

- `Simples --> Sofisticado`. Algo que nasce complexo, cresce complexo - no caso podemos relembrar sobre o conceito de desenvolvimento orgânico e impressora 3D (_Over engineering_).
- "Clico de vida de um desenvolvedor":
  ![alt text](imgs/image.png)
  > Um desenvolvedor começa com códigos simples e ruins(_Under engineering_) e, com o passar do tempo, vai melhorando. Entretanto, a complexidade aumenta MUITO (_Over engineering_). Após um ajuste o desenvolvedor encontra um `meio termo, desenvolvendo códigos simples e robustos`.
- A principal característica ou `qualidade de um software` é sobre o quão `modificável` ele é.

## architecture, files, and folders

- Arquitetura: escopo dos componentes e interação entre eles.
  - Uma arquitetura simples com ótima `modelagem` faz o sistema ir longe.

- Arquivos e Pastas: `hierarquia de informação`.

  ```
  . root
  ├── pages
  │   └── index.js
  ├── models
  │   ├── user.js
  │   ├── content.js
  │   └── password.js
  ├── infra
  │   ├── database.js
  │   ├── migrations
  │   └── provisioning
  │       └── staging
  │           └── production
  ├── tests
  ├── imgs
  │   └── image.png
  ├── package-lock.json
  ├── package.json
  └── README.md
  ```

---

# Testes Automatizados

- Ajuda a isolar onde o código está falhando.
- Código que executa outros códigos.
- Identificar `Regressão`.
- Visual e programática (`continuos integration`).
- Tipos de testes automatizados:
  - Pirâmide de testes (raiz):
  ```
    End-To-End (UI)
        |
        V
    Integration (Service, Endpoints, "o que os clientes usam.")
      |
      V
    Unit
  ```
- Endpoints (Ponto, local final)
  - Interface: GUI, o que o usuário vê.
  - API: Interface de programação das aplicações.
    - Os vínculos de informação por baixo dos panos.

## Instalar o test runner

- Existem vários tests runners no mercado, cada um com _diferentes abordagens_.
- `npm install --save-dev jest@29.6.2`.
- `npm test` (o comando foi adicionado nos scripts do sistema).
- `npm test::watch` (comando também salvo nos scripts) - _abre uma janela no terminal onde, de forma monitorada, ao salvar, executa os testes do sistema automaticamente_.

## TDD (Test Driven Development)nt)

- Desenvolvimento Orientado por testes.
- Exemplo de como escrever testes (`calculator.test.js`)
- O TDD é definido por três estágios:
  - RED: escrever o teste que falhará, que espera algo que awind nãio existe;
  - GREEN: faz a implementação concreta, fazendo os testes passarem;
  - BLUE: refatorar o código.

```js
describe("Context", () => {
  test("testName", function () {
    expect(x).toBe(x);
  });
});
```

# Versionamento da API

- É possível fazer o versionamento da API pormmeio da cosntrução de rotas, por exemplo `api/v1/status`
- O vercionamento feito acima se baseia no método `GET`, mas também é possivel ser feito com o método `POST`.
- Utilizando o método POST: ...

# Endpoints

- São testes que validam se determinada parte do sistema está integrada. Basicamente uma requisição é feita e, dependendo do código de status respondido no header http, o teste é validado ou não.
