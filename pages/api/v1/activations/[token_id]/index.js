import { createRouter } from "next-connect";
import controller from "../../../../../infra/controller.js";
import activation from "models/activation.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(
  controller.canRequest("read:activation_token"),
  controller.validateToken(),
  patchHandler,
);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;

  const validActiviationToken =
    await activation.findOneByValidId(activationTokenId);

  await activation.activateUserByUserId(validActiviationToken.user_id);

  const usedToken = await activation.markTokenAsUsed(activationTokenId);

  response.status(200).json(usedToken);
}

export default router.handler(controller.errorHandlers);
