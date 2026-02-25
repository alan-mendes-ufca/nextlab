import database from "infra/database.js";
import email from "../infra/email.js";
import webServer from "infra/webserver.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes;

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "techHub <contato@curso.dev>",
    to: user.email,
    subject: "Ative seu cadastro no Tech-Hub-Ufca!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Tech-Hub-Ufca!
    
${webServer.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe Tech-Hub-Ufca`,
  });
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens(user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      `,
      values: [userId, expiresAt],
    });
    return result.rows[0];
  }
}

async function findOneByUserId(userId) {
  const findedUser = await runSelectQuery(userId);
  return findedUser;

  async function runSelectQuery(userId) {
    const result = await database.query({
      text: `
      SELECT 
        id
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      `,
      values: [userId],
    });
    return result.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  findOneByUserId,
};

export default activation;
