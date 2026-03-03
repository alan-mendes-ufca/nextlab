import { createRouter } from "next-connect";
import controller from "../../../../infra/controller";
import migrator from "../../../../models/migrator.js";

const router = createRouter();

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  response.status(200).json(await migrator.listPendingMigrations());
}

async function postHandler(request, response) {
  const result = await migrator.runPendingMigrations();
  response.status(result.appliedMigrations.length > 0 ? 201 : 200).json(result);
}
