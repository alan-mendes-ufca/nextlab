import database from "infra/database.js";

async function create(logObject) {
  try {
    const formattedObject = formatLogObject(logObject);
    const storedLog = await runInsertQuery(formattedObject);
    return storedLog;
  } catch (loggingError) {
    console.error("Failed to persist application log:", loggingError);
  }

  function formatLogObject(logObject) {
    const {
      level,
      event,
      message,
      metadata,
      request,
      user,
      error,
      statusCode,
    } = logObject;

    return {
      level,
      event,
      message,
      metadata: {
        ...metadata,
        error_name: error?.name,
        error_message: error?.message,
        error_stack: error?.stack,
      },

      user_id: user?.id,

      request_id: request?.context?.request_id,
      method: request?.method,
      path: request?.url,
      status_code: statusCode,
    };
  }

  async function runInsertQuery(logObject) {
    const result = await database.query({
      text: `
      INSERT INTO application_logs (
        level,
        event,
        message,
        metadata,
        user_id,
        request_id,
        method,
        path,
        status_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `,
      values: [
        logObject.level,
        logObject.event,
        logObject.message,
        logObject.metadata ? JSON.stringify(logObject.metadata) : null,
        logObject.user_id || null,
        logObject.request_id || null,
        logObject.method || null,
        logObject.path || null,
        logObject.status_code || null,
      ],
    });

    return result.rows[0];
  }
}

async function findApplicationLogById(id) {
  const result = await database.query({
    text: "SELECT * FROM application_logs WHERE id = $1;",
    values: [id],
  });

  return result.rows[0];
}

async function findApplicationLogByRequestId(request_id) {
  const result = await database.query({
    text: "SELECT * FROM application_logs WHERE request_id = $1;",
    values: [request_id],
  });

  return result.rows[0];
}

async function findApplicationLogsByRequestId(request_id) {
  const result = await database.query({
    text: "SELECT * FROM application_logs WHERE request_id = $1;",
    values: [request_id],
  });

  return result.rows;
}

async function info(params) {
  return create({ ...params, level: "info" });
}

async function warn(params) {
  return create({ ...params, level: "warn" });
}

async function error(params) {
  return create({ ...params, level: "error" });
}

const logger = {
  info,
  warn,
  error,
  findApplicationLogById,
  findApplicationLogByRequestId,
  findApplicationLogsByRequestId,
};

export default logger;
