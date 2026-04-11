import orchestrator from "../../../../orchestrator.js";

/*
- O Jest@10.8.2 não suporta o `ECMAScript Modules (ESM)`! Diferente mente do next.js, 
 que utiliza um compilador `swc` para transpilar seu código moderno, para versões anteriores. 
 Além de muitas outras configurações fornecida pelo next.js.

- Vamos fornecer os recursos do next.js para o Jest por meio do jest.config.js - arquivo de configuração especial.

- Desafio 1: provar que o jest de fato está rodando no ambiente de testes, env.development não são carregas.
- Desafio 2: conseguir carregar essa variáveis no banco de dados.

*/

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pedding migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: "Verifique se o seu usuário possui a feature 'read:migrations'",
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pedding migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: "Verifique se o seu usuário possui a feature 'read:migrations'",
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieving pedding migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      await orchestrator.addFeaturesToUser(createdUser, ["read:migrations"]);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
