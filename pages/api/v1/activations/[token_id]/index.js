import { createRouter } from "next-connect";
import controller from "../../../../../infra/controller.js";
import activation from "models/activation.js";

const router = createRouter();

router.patch(patchHandler);

async function patchHandler(request, response) {
  const tokenId = request.query.token_id;
  const usedToken = await activation.markTokenAsUsed(tokenId);

  await activation.activateUserByUserId(usedToken.user_id);

  response.status(200).json(usedToken);
}

export default router.handler(controller.errorHandlers);
