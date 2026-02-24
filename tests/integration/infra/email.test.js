import email from "infra/email";
import orchestrator from "tests/orchestrator";

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();
    await email.send({
      from: "TecHubUfca <contato@ufca.dev",
      to: "contato@curso.dev",
      subject: "Teste de assunto.",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "TecHubUfca <contato@ufca.dev",
      to: "contato@curso.dev",
      subject: "Teste de assunto.",
      text: "Teste de corpo.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toEqual("<contato@ufca.dev>");
    expect(lastEmail.recipients[0]).toEqual("<contato@curso.dev>");
    expect(lastEmail.subject).toEqual("Teste de assunto.");
    expect(lastEmail.text).toEqual("Teste de corpo.\n");
  });
});
