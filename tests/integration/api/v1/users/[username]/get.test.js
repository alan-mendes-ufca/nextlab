import orchestrator from "../../../../../orchestrator.js";
import { version as uuidVersion } from "uuid";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDB();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      await orchestrator.createUser({
        username: "alanmendes",
        email: "alan49931@gmail.com",
        password: "5520240f17",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/alanmendes",
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "alanmendes",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
    test("With case mismatch", async () => {
      await orchestrator.createUser({
        username: "CaseDiferente",
        email: "CaseDiferente@gmail.com",
        password: "5520240f17",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/casediferente",
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "CaseDiferente",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });
    test("With invalid 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/invalidUser",
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Usuário não encontrado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 404,
      });
    });
    test("With empty 'username'", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users/");
      expect(response.status).toBe(405);
    });
  });
});
