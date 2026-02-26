import retry from "async-retry";
import { faker } from "@faker-js/faker";
import db from "../infra/database.js";
import migrator from "../models/migrator.js";
import user from "../models/user.js";
import session from "../models/session.js";
import activation from "../models/activation.js";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer(
    maxRetries = 100,
    // minTimeout = 500,
    maxTimeout = 1000,
  ) {
    return retry(fetchStatusPage, {
      retries: maxRetries,
      // minTimeout: minTimeout,
      maxTimeout: maxTimeout,
      onRetry: (error, attempt) => {
        console.log(
          `Attempt: ${attempt} - Failed to fetch status page: ${error.message}`,
        );
      },
    });

    async function fetchStatusPage() {
      try {
        const response = await fetch("http://localhost:3000/api/v1/status");
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      } catch (error) {
        console.error("Não foi possível buscar a páguina de status: ", error);
        throw error;
      }
    }
  }
  async function waitForEmailServer(maxRetries = 100, maxTimeout = 1000) {
    return retry(fetchEmail, {
      retries: maxRetries,
      maxTimeout: maxTimeout,
      onRetry: (error, attempt) => {
        console.log(
          `Attempt: ${attempt} - Failed to fetch status page: ${error.message}`,
        );
      },
    });

    async function fetchEmail() {
      try {
        const response = await fetch(emailHttpUrl);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      } catch (error) {
        console.error("Não foi possível buscar a páguina de status: ", error);
        throw error;
      }
    }
  }
}
async function clearDB() {
  await db.query("DROP schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPedingMigrations();
}

async function totalAppliedMigrations() {
  return (await db.query('SELECT COUNT(*) FROM  "public"."pg-migrations";'))
    .rows[0].count;
}

async function createUser(userObject) {
  const createdUser = await user.create({
    username:
      userObject.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject.email || faker.internet.email(),
    password: userObject.password || "password",
  });

  const activationToken = await activation.create(createdUser.id);
  await activation.sendEmailToUser(createdUser, activationToken);
  return createdUser;
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  // Esperar o email chegar no MailCatcher
  // eslint-disable-next-line no-undef
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 segundo

  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) return null;

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );

  const emailTextBody = await emailTextResponse.text();
  lastEmailItem.text = emailTextBody;
  return lastEmailItem;
}

function extractActivationTokenFromEmail(emailBody) {
  const regex = /\/cadastro\/ativar\/([a-zA-Z0-9\-_]+)/;
  const match = emailBody.match(regex);
  return match?.[1];
}

const orchestrator = {
  waitForAllServices,
  clearDB,
  runPendingMigrations,
  totalAppliedMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  extractActivationTokenFromEmail,
};

export default orchestrator;
