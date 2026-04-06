import { createRouter } from "next-connect";
import controller from "../../../../../infra/controller.js";
import user from "../../../../../models/user.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const userTryingToPatch = request.context.user;
  console.log(userTryingToPatch);

  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não tem autorização para alterar outro usuário.",
      action:
        "Verifique se você tem a feature necessária para alterar outros usuários.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  response.status(200).json(updatedUser);
}

export default router.handler(controller.errorHandlers);
