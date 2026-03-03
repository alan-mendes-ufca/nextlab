import { UnauthorizedError } from "../infra/errors.js";
import database from "../infra/database.js";
import crypto from "node:crypto";

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 Days

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newSession = await insertQuery(token, userId, expiresAt);
  return newSession;

  async function insertQuery(token, userId, expiresAt) {
    const result = await database.query({
      text: `
      INSERT INTO
        sessions (token, user_id, expires_at, updated_at)
      VALUES
        ($1, $2, $3, timezone('utc', now()))
      RETURNING
        *
      ;`,
      values: [token, userId, expiresAt],
    });

    return result.rows[0];
  }
}

async function findOneValidByToken(providedToken) {
  const sessionObject = await selectQueryForId(providedToken);
  return sessionObject;

  async function selectQueryForId(providedToken) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        sessions
      WHERE
        token = $1
        AND expires_at > NOW()
      ;`,
      values: [providedToken],
    });

    if (result.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
      });
    }

    return result.rows[0];
  }
}

async function renew(sessionId) {
  const newExpiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const renewedSessionObject = await updateQuery(sessionId, newExpiresAt);
  return renewedSessionObject;

  async function updateQuery(sessionId, newExpiresAt) {
    const result = await database.query({
      text: `
      UPDATE
        sessions
      SET
        expires_at = $2,
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [sessionId, newExpiresAt],
    });
    return result.rows[0];
  }
}

async function expireById(sessionId) {
  const expiredSessionObject = await updateQuery(sessionId);
  return expiredSessionObject;

  async function updateQuery(sessionId) {
    const result = await database.query({
      text: `
      UPDATE
        sessions
      SET
        expires_at = expires_at - interval '1 year',
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [sessionId],
    });
    return result.rows[0];
  }
}

const session = {
  create,
  findOneValidByToken,
  renew,
  expireById,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
