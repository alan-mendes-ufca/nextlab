import { createRouter } from "next-connect";
import controller from "../../../../../infra/controller.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(
  controller.canRequest("read:activation_token"),
  controller.validateTokenType(),
  patchHandler,
);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const activationTokenId = request.query.token_id;

  const validActiviationToken =
    await activation.findOneByValidId(activationTokenId);

  await activation.activateUserByUserId(validActiviationToken.user_id);

  const usedToken = await activation.markTokenAsUsed(activationTokenId);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedToken,
  );

  return response.status(200).json(secureOutputValues);
}

export default router.handler(controller.errorHandlers);
