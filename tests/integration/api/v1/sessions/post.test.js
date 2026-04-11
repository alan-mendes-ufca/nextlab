import session from "models/session.js";
import orchestrator from "../../../../orchestrator.js";
import { version as uuidVersion } from "uuid";
import * as cookie from "cookie";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect 'email' but correct 'password'", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "emailErrado@gmail.com",
          password: "senha-correta",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        action: "Verifique se os dados enviados estão corretos",
        message: "Dados de autenticação não conferem.",
        status_code: 401,
      });
    });
    test("With correct 'email' but incorrect 'password'", async () => {
      await orchestrator.createUser({
        email: "email.correto@gmail.com",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@gmail.com",
          password: "senha-incorreta",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        action: "Verifique se os dados enviados estão corretos",
        message: "Dados de autenticação não conferem.",
        status_code: 401,
      });
    });
    test("With incorrect 'email' and incorrect 'password'", async () => {
      await orchestrator.createUser();
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@gmail.com",
          password: "senha-incorreta",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        action: "Verifique se os dados enviados estão corretos",
        message: "Dados de autenticação não conferem.",
        status_code: 401,
      });
    });

    test("With correct 'email' and correct 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        password: "correctPassword",
      });

      await orchestrator.activateUser(createdUser);

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
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

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        created_at: responseBody.created_at,
        expires_at: responseBody.expires_at,
        id: responseBody.id,
        token: responseBody.token,
        updated_at: responseBody.updated_at,
        user_id: createdUser.id,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toEqual(session.EXPIRATION_IN_MILLISECONDS);

      const cookieObject = cookie.parseSetCookie(
        response.headers.getSetCookie()[0],
      );
      expect(cookieObject).toEqual({
        name: "session_token",
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
        secure: true,
      });
    });
  });
});
