import { createRouter } from "next-connect";
import controller from "../../../../infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, response);
  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const providedToken = request.cookies.session_id;
  const foundSession = await session.findOneValidByToken(providedToken);
  const expiredSessionObject = await session.expireById(foundSession.id);

  controller.clearSessionCookie(response);
  response.status(200).json(expiredSessionObject);
}
export default router.handler(controller.errorHandlers);
