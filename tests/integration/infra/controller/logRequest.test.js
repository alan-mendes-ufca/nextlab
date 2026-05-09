import webServer from "infra/webserver";
import logger from "models/logger";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/users", () => {
  describe("Anonymous User", () => {
    describe("logger.info", () => {
      test("With unique and valid data", async () => {
        const userObject = {
          username: "alanmendes",
          email: "alan.mendes@aluno.ufca.edu.br",
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
          username: "alanmendes",
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

        const requestLog = await logger.findApplicationLogByRequestId(
          response.headers.get("request_id"),
        );

        expect(requestLog).toEqual({
          id: requestLog.id,
          level: "info",
          event: "user.created",
          message: "Usuário criado com sucesso.",
          request_id: requestLog.request_id,
          user_id: null,
          method: "POST",
          path: "/api/v1/users",
          status_code: 201,
          metadata: {},
          created_at: requestLog.created_at,
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
            username: "usernameDuplico",
            email: "usernameDuplico1@gmail.com",
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

        const requestLog = await logger.findApplicationLogByRequestId(
          response2.headers.get("request_id"),
        );

        expect(requestLog).toEqual({
          id: requestLog.id,
          level: "warn",
          event: "validation.failed",
          message: "Username informado já está sendo utilizado.",
          request_id: requestLog.request_id,
          user_id: null,
          method: "POST",
          path: "/api/v1/users",
          status_code: 400,
          metadata: {
            error_name: "ValidationError",
            error_message: "Username informado já está sendo utilizado.",
            error_stack: requestLog.metadata.error_stack,
          },
          created_at: requestLog.created_at,
        });
      });
    });
  });
});
