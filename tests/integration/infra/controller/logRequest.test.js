import retry from "async-retry";

import webServer from "infra/webserver";
import logger from "models/logger";
import user from "models/user";
import activation from "models/activation";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

async function findRequestLog(response) {
  const [requestLog] = await findRequestLogs(response, 1);
  return requestLog;
}

async function findRequestLogs(response, expectedCount) {
  const requestId = response.headers.get("request_id");
  expect(requestId).toEqual(expect.any(String));

  // O log é persistido no callback assíncrono de response.on("finish").
  // O fetch pode retornar antes do INSERT terminar, então o retry evita falso negativo.
  return retry(
    async () => {
      const requestLogs =
        await logger.findApplicationLogsByRequestId(requestId);

      if (requestLogs.length !== expectedCount) {
        throw new Error(
          `Expected ${expectedCount} application logs, found ${requestLogs.length}.`,
        );
      }

      return requestLogs;
    },
    {
      retries: 5,
      minTimeout: 50,
      maxTimeout: 200,
    },
  );
}

async function expectSuccessLog(response, expectedLog) {
  const requestLog = await findRequestLog(response);

  expect(requestLog).toEqual({
    id: requestLog.id,
    level: "info",
    request_id: response.headers.get("request_id"),
    metadata: {},
    created_at: requestLog.created_at,
    ...expectedLog,
  });
}

async function expectErrorLogs(response, expectedRequestLog, expectedErrorLog) {
  const requestLogs = await findRequestLogs(response, 2);
  const contextualLog = requestLogs.find((log) => {
    return log.event === expectedRequestLog.event;
  });
  const errorLog = requestLogs.find((log) => {
    return log.event === expectedErrorLog.event;
  });

  expect(contextualLog).toBeDefined();
  expect(errorLog).toBeDefined();

  expect(contextualLog).toEqual({
    id: contextualLog.id,
    level: "info",
    request_id: response.headers.get("request_id"),
    metadata: {},
    created_at: contextualLog.created_at,
    ...expectedRequestLog,
  });

  expect(errorLog).toEqual({
    id: errorLog.id,
    request_id: response.headers.get("request_id"),
    ...expectedErrorLog,
    metadata: {
      error_name: expectedErrorLog.metadata.error_name,
      error_message: expectedErrorLog.metadata.error_message,
      error_stack: errorLog.metadata.error_stack,
    },
    created_at: errorLog.created_at,
  });
}

describe("controller.logRequest", () => {
  describe("POST to /api/v1/users", () => {
    describe("logger.info", () => {
      test("With unique and valid data", async () => {
        const userObject = {
          username: "logPostUser",
          email: "log.post.user@aluno.ufca.edu.br",
          password: "5520240f17",
        };
        const response = await fetch(`${webServer.origin}/api/v1/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userObject),
        });

        expect(response.status).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: "logPostUser",
          features: ["read:activation_token"],
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        const storedUser = await user.findOneById(responseBody.id);
        expect(storedUser).toEqual({
          ...userObject,
          id: responseBody.id,
          features: ["read:activation_token"],
          password: storedUser.password,
          created_at: storedUser.created_at,
          updated_at: storedUser.updated_at,
        });

        await expectSuccessLog(response, {
          event: "user.created",
          message: "Usuário criado com sucesso.",
          user_id: null,
          method: "POST",
          path: "/api/v1/users",
          status_code: 201,
        });
      });
    });

    describe("logger.warn", () => {
      test("With duplicated 'username'", async () => {
        const response1 = await fetch(`${webServer.origin}/api/v1/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "logPostDup",
            email: "log.post.dup1@gmail.com",
            password: "5520240f17",
          }),
        });

        expect(response1.status).toBe(201);

        const response2 = await fetch(`${webServer.origin}/api/v1/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "LogPostDup",
            email: "log.post.dup2@gmail.com",
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

        await expectErrorLogs(
          response2,
          {
            event: "user.created",
            message: "Usuário criado com sucesso.",
            user_id: null,
            method: "POST",
            path: "/api/v1/users",
            status_code: 400,
          },
          {
            level: "warn",
            event: "validation.failed",
            message: "Username informado já está sendo utilizado.",
            user_id: null,
            method: "POST",
            path: "/api/v1/users",
            status_code: 400,
            metadata: {
              error_name: "ValidationError",
              error_message: "Username informado já está sendo utilizado.",
            },
          },
        );
      });
    });
  });

  describe("GET to /api/v1/users/[username]", () => {
    test("logs a successful request", async () => {
      await orchestrator.createUser({
        username: "logGetUser",
        email: "log.get.user@gmail.com",
      });

      const response = await fetch(
        `${webServer.origin}/api/v1/users/logGetUser`,
      );

      expect(response.status).toBe(200);

      await expectSuccessLog(response, {
        event: "user.fetched",
        message: "Usuário consultado com sucesso.",
        user_id: null,
        method: "GET",
        path: "/api/v1/users/logGetUser",
        status_code: 200,
      });
    });

    test("logs an error handled by errorHandler", async () => {
      const response = await fetch(
        `${webServer.origin}/api/v1/users/logMissingUser`,
      );

      expect(response.status).toBe(404);

      await expectErrorLogs(
        response,
        {
          event: "user.fetched",
          message: "Usuário consultado com sucesso.",
          user_id: null,
          method: "GET",
          path: "/api/v1/users/logMissingUser",
          status_code: 404,
        },
        {
          level: "info",
          event: "resource.not_found",
          message: "Usuário não encontrado.",
          user_id: null,
          method: "GET",
          path: "/api/v1/users/logMissingUser",
          status_code: 404,
          metadata: {
            error_name: "NotFoundError",
            error_message: "Usuário não encontrado.",
          },
        },
      );
    });
  });

  describe("PATCH to /api/v1/users/[username]", () => {
    test("logs a successful request", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logPatchUser",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webServer.origin}/api/v1/users/logPatchUser`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "logPatchedUser",
          }),
        },
      );

      expect(response.status).toBe(200);

      await expectSuccessLog(response, {
        event: "user.updated",
        message: "Usuário atualizado com sucesso.",
        user_id: createdUser.id,
        method: "PATCH",
        path: "/api/v1/users/logPatchUser",
        status_code: 200,
      });
    });

    test("logs an error handled by errorHandler", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logPatchError",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webServer.origin}/api/v1/users/logPatchError`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_token=${sessionObject.token}`,
          },
          body: JSON.stringify({}),
        },
      );

      expect(response.status).toBe(400);

      await expectErrorLogs(
        response,
        {
          event: "user.updated",
          message: "Usuário atualizado com sucesso.",
          user_id: createdUser.id,
          method: "PATCH",
          path: "/api/v1/users/logPatchError",
          status_code: 400,
        },
        {
          level: "warn",
          event: "validation.failed",
          message: "Objeto enviado deve ser no mínimo uma chave.",
          user_id: createdUser.id,
          method: "PATCH",
          path: "/api/v1/users/logPatchError",
          status_code: 400,
          metadata: {
            error_name: "ValidationError",
            error_message: "Objeto enviado deve ser no mínimo uma chave.",
          },
        },
      );
    });
  });

  describe("GET to /api/v1/user", () => {
    test("logs a successful request", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logCurrentUser",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webServer.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      await expectSuccessLog(response, {
        event: "user.current.fetched",
        message: "Usuário autenticado consultado com sucesso.",
        user_id: createdUser.id,
        method: "GET",
        path: "/api/v1/user",
        status_code: 200,
      });
    });

    test("logs an error handled by errorHandler", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/user`);

      expect(response.status).toBe(403);

      await expectErrorLogs(
        response,
        {
          event: "user.current.fetched",
          message: "Usuário autenticado consultado com sucesso.",
          user_id: null,
          method: "GET",
          path: "/api/v1/user",
          status_code: 403,
        },
        {
          level: "warn",
          event: "authorization.failed",
          message: "Você não possui permissão para executar esta ação.",
          user_id: null,
          method: "GET",
          path: "/api/v1/user",
          status_code: 403,
          metadata: {
            error_name: "ForbiddenError",
            error_message: "Você não possui permissão para executar esta ação.",
          },
        },
      );
    });
  });

  describe("POST to /api/v1/sessions", () => {
    test("logs a successful request", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logPostSession",
        email: "log.post.session@gmail.com",
        password: "correctPassword",
      });
      await orchestrator.activateUser(createdUser);

      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: createdUser.email,
          password: "correctPassword",
        }),
      });

      expect(response.status).toBe(201);

      await expectSuccessLog(response, {
        event: "session.created",
        message: "Sessão criada com sucesso.",
        user_id: null,
        method: "POST",
        path: "/api/v1/sessions",
        status_code: 201,
      });
    });

    test("logs an error handled by errorHandler", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logPostSessionError",
        email: "log.post.session.error@gmail.com",
        password: "correctPassword",
      });
      await orchestrator.activateUser(createdUser);

      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: createdUser.email,
          password: "incorrectPassword",
        }),
      });

      expect(response.status).toBe(401);

      await expectErrorLogs(
        response,
        {
          event: "session.created",
          message: "Sessão criada com sucesso.",
          user_id: null,
          method: "POST",
          path: "/api/v1/sessions",
          status_code: 401,
        },
        {
          level: "warn",
          event: "authentication.failed",
          message: "Dados de autenticação não conferem.",
          user_id: null,
          method: "POST",
          path: "/api/v1/sessions",
          status_code: 401,
          metadata: {
            error_name: "UnauthorizedError",
            error_message: "Dados de autenticação não conferem.",
          },
        },
      );
    });
  });

  describe("DELETE to /api/v1/sessions", () => {
    test("logs a successful request", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logDeleteSession",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      await expectSuccessLog(response, {
        event: "session.deleted",
        message: "Sessão encerrada com sucesso.",
        user_id: createdUser.id,
        method: "DELETE",
        path: "/api/v1/sessions",
        status_code: 200,
      });
    });

    test("logs an error handled by errorHandler", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "DELETE",
      });

      expect(response.status).toBe(401);

      await expectErrorLogs(
        response,
        {
          event: "session.deleted",
          message: "Sessão encerrada com sucesso.",
          user_id: null,
          method: "DELETE",
          path: "/api/v1/sessions",
          status_code: 401,
        },
        {
          level: "warn",
          event: "authentication.failed",
          message: "Usuário não possui sessão ativa.",
          user_id: null,
          method: "DELETE",
          path: "/api/v1/sessions",
          status_code: 401,
          metadata: {
            error_name: "UnauthorizedError",
            error_message: "Usuário não possui sessão ativa.",
          },
        },
      );
    });
  });

  describe("PATCH to /api/v1/activations/[token_id]", () => {
    test("logs a successful request", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logActivateUser",
      });
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webServer.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      await expectSuccessLog(response, {
        event: "user.activated",
        message: "Usuário ativado com sucesso.",
        user_id: null,
        method: "PATCH",
        path: `/api/v1/activations/${activationToken.id}`,
        status_code: 200,
      });
    });

    test("logs an error handled by errorHandler", async () => {
      const response = await fetch(
        `${webServer.origin}/api/v1/activations/invalidActivationToken`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(400);

      await expectErrorLogs(
        response,
        {
          event: "user.activated",
          message: "Usuário ativado com sucesso.",
          user_id: null,
          method: "PATCH",
          path: "/api/v1/activations/invalidActivationToken",
          status_code: 400,
        },
        {
          level: "warn",
          event: "validation.failed",
          message: `"token_id" deve ser um UUID v4 válido.`,
          user_id: null,
          method: "PATCH",
          path: "/api/v1/activations/invalidActivationToken",
          status_code: 400,
          metadata: {
            error_name: "ValidationError",
            error_message: `"token_id" deve ser um UUID v4 válido.`,
          },
        },
      );
    });
  });

  describe("GET to /api/v1/migrations", () => {
    test("logs a successful request", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logGetMigration",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);
      await orchestrator.addFeaturesToUser(createdUser, ["read:migrations"]);

      const response = await fetch(`${webServer.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      await expectSuccessLog(response, {
        event: "migrations.listed",
        message: "Migrações listadas com sucesso.",
        user_id: createdUser.id,
        method: "GET",
        path: "/api/v1/migrations",
        status_code: 200,
      });
    });

    test("logs an error handled by errorHandler", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/migrations`);

      expect(response.status).toBe(403);

      await expectErrorLogs(
        response,
        {
          event: "migrations.listed",
          message: "Migrações listadas com sucesso.",
          user_id: null,
          method: "GET",
          path: "/api/v1/migrations",
          status_code: 403,
        },
        {
          level: "warn",
          event: "authorization.failed",
          message: "Você não possui permissão para executar esta ação.",
          user_id: null,
          method: "GET",
          path: "/api/v1/migrations",
          status_code: 403,
          metadata: {
            error_name: "ForbiddenError",
            error_message: "Você não possui permissão para executar esta ação.",
          },
        },
      );
    });
  });

  describe("POST to /api/v1/migrations", () => {
    test("logs a successful request", async () => {
      const createdUser = await orchestrator.createUser({
        username: "logPostMigration",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);
      await orchestrator.addFeaturesToUser(createdUser, ["create:migrations"]);

      const response = await fetch(`${webServer.origin}/api/v1/migrations`, {
        method: "POST",
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      await expectSuccessLog(response, {
        event: "migrations.executed",
        message: "Migrações executadas com sucesso.",
        user_id: createdUser.id,
        method: "POST",
        path: "/api/v1/migrations",
        status_code: 200,
      });
    });

    test("logs an error handled by errorHandler", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/migrations`, {
        method: "POST",
      });

      expect(response.status).toBe(403);

      await expectErrorLogs(
        response,
        {
          event: "migrations.executed",
          message: "Migrações executadas com sucesso.",
          user_id: null,
          method: "POST",
          path: "/api/v1/migrations",
          status_code: 403,
        },
        {
          level: "warn",
          event: "authorization.failed",
          message: "Você não possui permissão para executar esta ação.",
          user_id: null,
          method: "POST",
          path: "/api/v1/migrations",
          status_code: 403,
          metadata: {
            error_name: "ForbiddenError",
            error_message: "Você não possui permissão para executar esta ação.",
          },
        },
      );
    });
  });

  describe("GET to /api/v1/status", () => {
    test("keeps request_id header and skips application log persistence", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/status`);

      expect(response.status).toBe(200);
      expect(response.headers.get("request_id")).toEqual(expect.any(String));

      const requestLog = await logger.findApplicationLogByRequestId(
        response.headers.get("request_id"),
      );

      expect(requestLog).toBeUndefined();
    });
  });
});
