import activation from "models/activation.js";
import orchestrator from "../orchestrator.js";
import user from "models/user.js";
import webserver from "../../infra/webserver.js";
import * as cookie from "cookie";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: registration flow and session lifecycle", () => {
  let createdUserResponseBody;
  let activationToken;
  let createdSessionResponseBody;

  test("Create user account", async () => {
    const createdUserResponse = await fetch(
      `${webserver.origin}/api/v1/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@curso.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createdUserResponse.status).toBe(201);

    createdUserResponseBody = await createdUserResponse.json();

    expect(createdUserResponseBody).toEqual({
      id: createdUserResponseBody.id,
      username: "RegistrationFlow",
      // ação:objeto:modificador
      features: ["read:activation_token"],
      created_at: createdUserResponseBody.created_at,
      updated_at: createdUserResponseBody.updated_at,
    });
  });
  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@nextlab.tec.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
    expect(lastEmail.subject).toEqual("Ative seu cadastro no nextlab!");
    expect(lastEmail.text).toContain("RegistrationFlow");

    activationToken = orchestrator.extractActivationTokenFromEmail(
      lastEmail.text,
    );

    const findedToken = await activation.findOneByValidId(activationToken);

    expect(findedToken.user_id).toEqual(createdUserResponseBody.id);
    expect(findedToken.used_at).toEqual(null);
  });
  test("Activate account", async () => {
    const response = await fetch(
      `${webserver.origin}/api/v1/activations/${activationToken}`,
      {
        method: "PATCH",
      },
    );
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(Date.parse(responseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername(
      createdUserResponseBody.username,
    );
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
      "read:status",
    ]);

    createdUserResponseBody = activatedUser;
  });

  test("Login", async () => {
    const createdSessionResponse = await fetch(
      `${webserver.origin}/api/v1/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@curso.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createdSessionResponse.status).toBe(201);

    createdSessionResponseBody = await createdSessionResponse.json();
    expect(createdSessionResponseBody.user_id).toEqual(
      createdUserResponseBody.id,
    );
  });

  test("Get user information and renew session", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/user`, {
      headers: {
        Cookie: `session_token=${createdSessionResponseBody.token}`,
      },
    });
    expect(response.status).toBe(200);

    const createdUserWithoutPassword = structuredClone(createdUserResponseBody);
    delete createdUserWithoutPassword.password;

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      ...createdUserWithoutPassword,
      created_at: createdUserResponseBody.created_at.toISOString(),
      updated_at: createdUserResponseBody.updated_at.toISOString(),
    });
  });

  test("Log out", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_token=${createdSessionResponseBody.token}`,
      },
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();

    expect(responseBody).toEqual({
      id: createdSessionResponseBody.id,
      token: createdSessionResponseBody.token,
      created_at: createdSessionResponseBody.created_at,
      expires_at: responseBody.expires_at,
      updated_at: responseBody.updated_at,
      user_id: createdUserResponseBody.id,
    });

    const oldExpiresAt = new Date(createdSessionResponseBody.expires_at);
    const newExpiresAt = new Date(responseBody.expires_at);

    oldExpiresAt.setMilliseconds(0);
    newExpiresAt.setMilliseconds(0);

    expect(Date.parse(oldExpiresAt) > Date.parse(newExpiresAt)).toBe(true);

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

  test("Reject login attempt with old session token after logout", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_token=${createdSessionResponseBody.token}`,
      },
      body: JSON.stringify({
        email: createdUserResponseBody.email,
        password: "RegistrationFlowPassword",
      }),
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

  test("Login again with new session token", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: createdUserResponseBody.email,
        password: "RegistrationFlowPassword",
      }),
    });

    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id: responseBody.id,
      token: responseBody.token,
      created_at: responseBody.created_at,
      expires_at: responseBody.expires_at,
      updated_at: responseBody.updated_at,
      user_id: createdUserResponseBody.id,
    });
    expect(responseBody.token).not.toBe(createdSessionResponseBody.token);
  });
});
