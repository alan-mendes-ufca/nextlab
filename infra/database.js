import pkg from "pg";

const { Client } = pkg;
import { ServicesError } from "./errors.js";

async function query(queryObject) {
  let client;

  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    throw new ServicesError({
      message: "Erro de conexão no banco ou query.",
      cause: error,
    });
  } finally {
    await client?.end();
  }
}

async function getNewClient() {
  const client = new Client({
    // psql --host=localhost --username=postgres --port=5432
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD, // objeto javascript
    ssl: getSSLValues(),
  });

  await client.connect();

  return client;
}

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return process.env.POSTGRES_CA;
  }

  return !(
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  );
}

const database = {
  query,
  getNewClient,
};
export default database;
