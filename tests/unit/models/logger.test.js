import logger from "models/logger.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("models/logger.js", () => {
  describe(".info()", () => {
    test("persists an info log with request, user, metadata, status and error data", async () => {
      const error = new Error("Something went wrong");
      const logObject = {
        event: "user.created",
        message: "User was created.",
        metadata: {
          source: "tests",
        },
        request: {
          context: {
            request_id: "cd77fd55-884b-47c1-a493-19c6d49d9f92",
          },
          method: "POST",
          url: "/api/v1/users",
        },
        user: {
          id: "2f30c867-6332-4f09-8fa3-65ab8bdcc111",
        },
        error,
        statusCode: 201,
      };

      const storedLog = await logger.info(logObject);
      const persistedLog = await logger.findApplicationLogById(storedLog.id);
      const persistedLogByRequestId =
        await logger.findApplicationLogByRequestId(
          logObject.request.context.request_id,
        );

      expect(storedLog).toEqual(persistedLog);
      expect(persistedLogByRequestId).toEqual(persistedLog);
      expect(persistedLog).toEqual({
        id: storedLog.id,
        level: "info",
        event: "user.created",
        message: "User was created.",
        metadata: {
          source: "tests",
          error_name: "Error",
          error_message: "Something went wrong",
          error_stack: error.stack,
        },
        user_id: "2f30c867-6332-4f09-8fa3-65ab8bdcc111",
        request_id: "cd77fd55-884b-47c1-a493-19c6d49d9f92",
        method: "POST",
        path: "/api/v1/users",
        status_code: 201,
        created_at: persistedLog.created_at,
      });
    });
  });

  describe(".warn()", () => {
    test("persists a warning log", async () => {
      const storedLog = await logger.warn({
        event: "rate-limit.reached",
        message: "Rate limit was reached.",
      });

      const persistedLog = await logger.findApplicationLogById(storedLog.id);

      expect(persistedLog).toMatchObject({
        level: "warn",
        event: "rate-limit.reached",
        message: "Rate limit was reached.",
      });
      expect(persistedLog.metadata).toEqual({});
    });
  });

  describe(".error()", () => {
    test("persists an error log", async () => {
      const storedLog = await logger.error({
        event: "session.create.failed",
        message: "Session could not be created.",
      });

      const persistedLog = await logger.findApplicationLogById(storedLog.id);

      expect(persistedLog).toMatchObject({
        level: "error",
        event: "session.create.failed",
        message: "Session could not be created.",
      });
      expect(persistedLog.metadata).toEqual({});
    });
  });

  test("persists null values when optional fields are missing", async () => {
    const storedLog = await logger.info({
      event: "system.started",
    });

    const persistedLog = await logger.findApplicationLogById(storedLog.id);

    expect(persistedLog).toEqual({
      id: storedLog.id,
      level: "info",
      event: "system.started",
      message: null,
      metadata: {},
      user_id: null,
      request_id: null,
      method: null,
      path: null,
      status_code: null,
      created_at: persistedLog.created_at,
    });
  });
});
