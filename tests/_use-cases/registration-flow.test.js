import activation from "models/activation.js";
import orchestrator from "../orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createdUserResponseBody;
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

    const activationToken = orchestrator.extractActivationTokenFromEmail(
      lastEmail.text,
    );

    const findedToken =
      await activation.findOneByActivationToken(activationToken);

    expect(findedToken.user_id).toEqual(createdUserResponseBody.id);
    expect(findedToken.used_at).toEqual(null);
  });
  test("Activate account", async () => {});

  test("Login", async () => {});

  test("GET user information", async () => {});
});
