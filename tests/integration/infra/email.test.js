import email from "infra/email";
import orchestrator from "tests/orchestrator";

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();
    await email.send({
      from: "TecHubUfca <contato@nextlab.tec.br>",
      to: "teste@teste.com",
      subject: "Teste de assunto.",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "TecHubUfca <contato@nextlab.tec.br>",
      to: "teste@teste.com",
      subject: "Teste de assunto.",
      text: "Teste de corpo.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toEqual("<contato@nextlab.tec.br>");
    expect(lastEmail.recipients[0]).toEqual("<teste@teste.com>");
    expect(lastEmail.subject).toEqual("Teste de assunto.");
    expect(lastEmail.text).toEqual("Teste de corpo.\n");
  });
});
