import user from "models/user.js";
import orchestrator from "../../../../orchestrator.js";
import { version as uuidVersion } from "uuid";
import password from "models/password.js";
import webserver from "../../../../../infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "alanmendes",
          email: "alan.mendes@aluno.ufca.edu.br",
          password: "5520240f17",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "alanmendes",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername(
        responseBody.username,
      );

      const correctPasswordMatch = await password.compare(
        "5520240f17",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "SenhaIncorreta",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
    test("With duplicated 'email'", async () => {
      const response1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailDuplicado1",
          email: "emailDuplicado@gmail.com",
          password: "5520240f17",
        }),
      });

      expect(response1.status).toBe(201);

      const responseBody = await response1.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "emailDuplicado1",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailDuplicado2",
          email: "EmailDuplicado@gmail.com",
          password: "5520240f17",
        }),
      });

      expect(response2.status).toBe(400);

      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "ValidationError",
        message: "Email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With duplicated 'username'", async () => {
      const response1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameDuplico",
          email: "usernameDuplico1@gmail.com",
          password: "5520240f17",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UsernameDuplico",
          email: "usernameDuplico2@gmail.com",
          password: "5520240f17",
        }),
      });

      expect(response2.status).toBe(400);

      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "ValidationError",
        message: "Username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With empty 'email'", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameDuplico",
          email: "",
          password: "5520240f17",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: `"email" não pode estar em branco.`,
        status_code: 400,
      });
    });
    test("With empty 'username'", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "",
          email: "teste@gmail.com",
          password: "5520240f17",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody1 = await response.json();
      expect(responseBody1).toEqual({
        name: "ValidationError",
        message: `"username" não pode estar em branco.`,
        status_code: 400,
      });
    });
  });
  describe("Default User", () => {
    test("With unique and valid data", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "alanmendes",
          email: "alan.mendes@aluno.ufca.edu.br",
          password: "5520240f17",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: `Verifique se o seu usuário possui a feature 'create:user'`,
        status_code: 403,
      });
    });
  });
});
