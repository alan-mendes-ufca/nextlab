import { createRouter } from "next-connect";
import controller from "../../../../infra/controller.js";
import database from "../../../../infra/database.js";
import authorization from "models/authorization.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(
    controller.logRequest("status.fetched", "Status consultado com sucesso."),
    controller.canRequest("read:status"),
    getHandler,
  )
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const statusObject = {
    updated_at: database.updatedAt(),
    dependencies: {
      database: {
        version: await database.databaseVersionResult(),
        max_connections: parseInt(await database.maxConnections()),
        opened_connections: await database.openedConnectionsValues(),
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  return response.status(200).json(secureOutputValues);
}
