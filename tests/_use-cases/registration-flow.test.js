import activation from "models/activation.js";
import orchestrator from "../orchestrator.js";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createdUserResponseBody;
  let activationToken;
  let createdSessionResponseBody;

  test("Create user account", async () => {
    const createdUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
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
      email: "registration.flow@curso.dev",
      password: createdUserResponseBody.password,
      // ação:objeto:modificador
      features: ["read:activation_token"],
      created_at: createdUserResponseBody.created_at,
      updated_at: createdUserResponseBody.updated_at,
    });
  });
  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@curso.dev>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
    expect(lastEmail.subject).toEqual("Ative seu cadastro no Tech-Hub-Ufca!");
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
      `http://localhost:3000/api/v1/activations/${activationToken}`,
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
    expect(activatedUser.features).toEqual(["create:session", "read:session"]);

    createdUserResponseBody = activatedUser;
  });

  test("Login", async () => {
    const createdSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
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

  test("GET user information", async () => {
    const response = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        Cookie: `session_token=${createdSessionResponseBody.token}`,
      },
    });
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      ...createdUserResponseBody,
      created_at: createdUserResponseBody.created_at.toISOString(),
      updated_at: createdUserResponseBody.updated_at.toISOString(),
    });
  });
});
