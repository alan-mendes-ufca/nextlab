import password from "models/password.js";
import orchestrator from "../../../../../orchestrator.js";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "user1@gmail.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "user2@gmail.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user1@gmail.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With nonexistent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Usuário não encontrado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 404,
      });
    });
    test("With unique 'username'", async () => {
      await orchestrator.createUser({
        username: "uniqueUser1",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser2",
        email: responseBody.email,
        password: responseBody.password,
        features: [],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(Date.parse(responseBody.created_at)).not.toEqual(
        Date.parse(responseBody.updated_at),
      );
    });
    test("With change 'email'", async () => {
      const createdUser = await orchestrator.createUser({
        email: "uniqueEmail1@gmail.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "uniqueEmail2@curso.dev",
          }),
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: responseBody.username,
        email: responseBody.email,
        password: responseBody.password,
        features: [],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(Date.parse(responseBody.created_at)).not.toEqual(
        Date.parse(responseBody.updated_at),
      );
    });
    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        password: "senha123",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "senha456",
          }),
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);

      const correctPasswordMatch = await password.compare(
        "senha456",
        responseBody.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "senhaIncorreta",
        responseBody.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
