import session from "../../../../../models/session.js";
import orchestrator from "../../../../orchestrator.js";
import { version as uuidVersion } from "uuid";
import * as cookie from "cookie";
import webserver from "../../../../../infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With injected anonymous user", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/user`);
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se o seu usuário possui a feature 'read:session'",
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("With valid 'session'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const activatedUser = await orchestrator.activateUser(createdUser);

      const sessionObject = await orchestrator.createSession(createdUser);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toEqual(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        features: [
          "create:session",
          "read:session",
          "update:user",
          "read:status",
        ],
        created_at: createdUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();

      // Session renewed assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        Date.parse(renewedSessionObject.expires_at) >
          Date.parse(sessionObject.expires_at),
      ).toBe(true);

      // Set-Cookie assertions
      const cookieObject = cookie.parseSetCookie(
        response.headers.getSetCookie()[0],
      );
      expect(cookieObject).toEqual({
        name: "session_token",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
        secure: true,
      });
    });

    test("With non-existent 'session'", async () => {
      const invalidSession =
        "wiw6Gezs61i9ahIKomfoFm83Pdg7hnpYIIuiE+AzIVQNm/ojhkca5tQj3YvET5y0";
      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_token=${invalidSession}`,
        },
      });
      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
        status_code: 401,
      });

      // Clear Set-Cookie assertion
      const parsedSetCookie = cookie.parseSetCookie(
        response.headers.getSetCookie()[0],
      );

      expect(parsedSetCookie).toEqual({
        name: "session_token",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
        secure: true,
      });
    });

    test("With expired 'session'", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
        status_code: 401,
      });

      const parsedSetCookie = cookie.parseSetCookie(
        response.headers.getSetCookie()[0],
      );

      // Clear Set-Cookie assertion
      expect(parsedSetCookie).toEqual({
        name: "session_token",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
        secure: true,
      });
    });

    test("With 'session' in halfway to expiration", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS / 2),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithSessionInHalfway",
      });

      const activatedUser = await orchestrator.activateUser(createdUser);

      const sessionObject = await orchestrator.createSession(activatedUser);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_token=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        Date.parse(renewedSessionObject.expires_at) >
          Date.parse(sessionObject.expires_at),
      ).toBe(true);
    });
  });
});
