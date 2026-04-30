import validateRequest from "models/validateRequest.js";

const VALID_TOKEN = "a".repeat(96);

describe("validateRequest username schema", () => {
  test("With non-string username", () => {
    expect(() =>
      validateRequest({ username: 123 }, { username: "required" }),
    ).toThrow(`"username" deve ser do tipo String.`);
  });

  test("With empty username", () => {
    expect(() =>
      validateRequest({ username: "" }, { username: "required" }),
    ).toThrow(`"username" não pode estar em branco.`);
  });

  test("With non-alphanumeric username", () => {
    expect(() =>
      validateRequest({ username: "user_name" }, { username: "required" }),
    ).toThrow(`"username" deve conter apenas caracteres alfanuméricos.`);
  });

  test("With username shorter than 3 characters", () => {
    expect(() =>
      validateRequest({ username: "ab" }, { username: "required" }),
    ).toThrow(`"username" deve conter no mínimo 3 caracteres.`);
  });

  test("With username longer than 30 characters", () => {
    expect(() =>
      validateRequest({ username: "a".repeat(31) }, { username: "required" }),
    ).toThrow(`"username" deve conter no máximo 30 caracteres.`);
  });

  test("With null username", () => {
    expect(() =>
      validateRequest({ username: null }, { username: "required" }),
    ).toThrow(`"username" possui o valor inválido "null".`);
  });

  test("Trims username", () => {
    const cleanValues = validateRequest(
      { username: "  alice  " },
      { username: "required" },
    );

    expect(cleanValues.username).toBe("alice");
  });
});

describe("validateRequest email schema", () => {
  test("With non-string email", () => {
    expect(() =>
      validateRequest({ email: 123 }, { email: "required" }),
    ).toThrow(`"email" deve ser do tipo String.`);
  });

  test("With empty email", () => {
    expect(() => validateRequest({ email: "" }, { email: "required" })).toThrow(
      `"email" não pode estar em branco.`,
    );
  });

  test("With invalid email format", () => {
    expect(() =>
      validateRequest({ email: "email-invalido" }, { email: "required" }),
    ).toThrow(`"email" deve conter um email válido.`);
  });

  test("With null email", () => {
    expect(() =>
      validateRequest({ email: null }, { email: "required" }),
    ).toThrow(`"email" possui o valor inválido "null".`);
  });

  test("Lowercases and trims email", () => {
    const cleanValues = validateRequest(
      { email: "  John.Doe@Example.COM  " },
      { email: "required" },
    );

    expect(cleanValues.email).toBe("john.doe@example.com");
  });
});

describe("validateRequest password schema", () => {
  test("With non-string password", () => {
    expect(() =>
      validateRequest({ password: 123 }, { password: "required" }),
    ).toThrow(`"password" deve ser do tipo String.`);
  });

  test("With empty password", () => {
    expect(() =>
      validateRequest({ password: "" }, { password: "required" }),
    ).toThrow(`"password" não pode estar em branco.`);
  });

  test("With password shorter than 8 characters", () => {
    expect(() =>
      validateRequest({ password: "1234567" }, { password: "required" }),
    ).toThrow(`"password" deve conter no mínimo 8 caracteres.`);
  });

  test("With password longer than 72 characters", () => {
    expect(() =>
      validateRequest({ password: "a".repeat(73) }, { password: "required" }),
    ).toThrow(`"password" deve conter no máximo 72 caracteres.`);
  });

  test("With null password", () => {
    expect(() =>
      validateRequest({ password: null }, { password: "required" }),
    ).toThrow(`"password" possui o valor inválido "null".`);
  });

  test("Trims password", () => {
    const cleanValues = validateRequest(
      { password: "  password123  " },
      { password: "required" },
    );

    expect(cleanValues.password).toBe("password123");
  });
});

describe("validateRequest token_id schema", () => {
  test("With non-string token_id", () => {
    expect(() =>
      validateRequest({ token_id: 123 }, { token_id: "required" }),
    ).toThrow(`"token_id" deve ser do tipo string.`);
  });

  test("With invalid token_id", () => {
    expect(() =>
      validateRequest({ token_id: "invalid-token" }, { token_id: "required" }),
    ).toThrow(`"token_id" deve ser um UUID v4 válido.`);
  });

  test("Accepts valid token_id", () => {
    const cleanValues = validateRequest(
      { token_id: "0e768f08-fef1-4189-ab87-8358c568bf18" },
      { token_id: "required" },
    );

    expect(cleanValues.token_id).toBe("0e768f08-fef1-4189-ab87-8358c568bf18");
  });
});

describe("validateRequest session_token schema", () => {
  test("With non-string session_token", () => {
    expect(() =>
      validateRequest({ session_token: 123 }, { session_token: "required" }),
    ).toThrow(`"session_token" deve ser do tipo string.`);
  });

  test("With non-hex session_token", () => {
    const invalidToken = `g${"a".repeat(95)}`;

    expect(() =>
      validateRequest(
        { session_token: invalidToken },
        { session_token: "required" },
      ),
    ).toThrow(`"session_token" deve conter apenas caracteres hexadecimais.`);
  });

  test("With invalid session_token length", () => {
    const invalidToken = "a".repeat(95);

    expect(() =>
      validateRequest(
        { session_token: invalidToken },
        { session_token: "required" },
      ),
    ).toThrow(`"session_token" deve ter 96 caracteres.`);
  });

  test("Lowercases session_token", () => {
    const uppercaseToken = "A".repeat(96);

    const cleanValues = validateRequest(
      { session_token: uppercaseToken },
      { session_token: "required" },
    );

    expect(cleanValues.session_token).toBe(VALID_TOKEN);
  });
});
