import { runner } from "node-pg-migrate";
import { resolve } from "node:path";
import db from "../infra/database.js";

const MIGRATIONS_DIR = resolve("infra", "migrations");

const defaultMigrationsOptions = {
  dryRun: true,
  dir: MIGRATIONS_DIR,
  direction: "up",
  log: () => {},
  migrationsTable: "pg-migrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await db.getNewClient();

    const pendingMigrations = await runner({
      ...defaultMigrationsOptions,
      dbClient: dbClient,
    });

    return { pendingMigrations: pendingMigrations ?? [] };
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await db.getNewClient();

    const pendingMigrations = await runner({
      ...defaultMigrationsOptions,
      dbClient: dbClient,
      dryRun: false,
    });

    return {
      appliedMigrations: pendingMigrations.length > 0 ? pendingMigrations : [],
    };
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
