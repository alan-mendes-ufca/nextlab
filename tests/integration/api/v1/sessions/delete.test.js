import session from "models/session.js";
import orchestrator from "../../../../orchestrator.js";
import * as cookie from "cookie";
import webserver from "../../../../../infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("DELETE to /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With nonexistent session", async () => {
      const invalidToken =
        "7e00c23355afc16a39f10c87f7e5e7b5bf48621a9954150864fad311f065a26476f86c900059f65efe3341d5394fca05";

      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          cookie: `session_token=${invalidToken}`,
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
    });
    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();
      const validToken = (await orchestrator.createSession(createdUser)).token;

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          cookie: `session_token=${validToken}`,
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
    });
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser();
      const sessionObject = await orchestrator.createSession(createdUser);
      const validToken = sessionObject.token;
      const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_token=${validToken}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(
        Date.parse(responseBody.created_at) >
          Date.parse(responseBody.expires_at),
      ).toBe(true);

      // Set-Cookie assertions
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

      // Try to delete the session again with the same token
      const response2 = await fetch(`${webserver.origin}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          cookie: `session_token=${validToken}`,
        },
      });
      expect(response2.status).toBe(401);
    });
  });
});
