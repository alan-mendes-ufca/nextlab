import password from "models/password.js";
import orchestrator from "../../../../../orchestrator.js";
import { version as uuidVersion } from "uuid";
import user from "models/user.js";
import webserver from "../../../../../../infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique and valid 'username'", async () => {
      await orchestrator.createUser({
        username: "anonymousUser",
      });

      const response = await fetch(
        `${webserver.origin}/api/v1/users/anonymousUser`,
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

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: "Verifique se o seu usuário possui a feature 'update:user'",
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });
      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(`${webserver.origin}/api/v1/users/user2`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_token=${sessionObject2.token}`,
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

    test("With 'userB' targeting 'userA'", async () => {
      await orchestrator.createUser({
        username: "userA",
      });

      const createdUser = await orchestrator.createUser({
        username: "userB",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(`${webserver.origin}/api/v1/users/userA`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_token=${sessionObject.token}`,
        },
        body: JSON.stringify({
          username: "userC",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action:
          "Verifique se você tem a feature necessária para alterar outros usuários.",
        message: "Você não tem autorização para alterar outro usuário.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "user1@gmail.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "user2@gmail.com",
      });
      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionObject2.token}`,
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
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/UsuarioInexistente`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_token=${sessionObject.token}`,
          },
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
      const createdUser = await orchestrator.createUser({
        username: "uniqueUser1",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/uniqueUser1`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionObject.token}`,
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
        features: [
          "create:session",
          "read:session",
          "update:user",
          "read:status",
        ],
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
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionObject.token}`,
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
        features: [
          "create:session",
          "read:session",
          "update:user",
          "read:status",
        ],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(Date.parse(responseBody.created_at)).not.toEqual(
        Date.parse(responseBody.updated_at),
      );

      const storedEmail = (await user.findOneByUsername(createdUser.username))
        .email;
      expect(storedEmail).toEqual("uniqueEmail2@curso.dev");
    });

    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        password: "senha123",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: "senha456",
          }),
        },
      );
      expect(response.status).toBe(200);

      const updatedUser = await user.findOneById(createdUser.id);

      const correctPasswordMatch = await password.compare(
        "senha456",
        updatedUser.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "senhaIncorreta",
        updatedUser.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Privileged user", () => {
    test("With 'update:user:others' targeting 'Default user'", async () => {
      const privilegedUser = await orchestrator.createUser({
        username: "privilegedUser",
      });

      const activatedPrivilegedUser =
        await orchestrator.activateUser(privilegedUser);

      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);

      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      const defaultUser = await orchestrator.createUser();
      const response = await fetch(
        `${webserver.origin}/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "alteradoPorPrivilegedUser",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.username).toEqual("alteradoPorPrivilegedUser");
    });
  });
});
