import * as cookie from "cookie";

import {
  MethodNotAllowedError,
  InternalServerError,
  ValitationError,
  NotFoundError,
  UnautorizedError,
  ForbiddenError,
} from "./errors.js";
import session from "models/session.js";
import user from "models/user.js";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValitationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    response.status(error.statusCode).json(error);
  }

  if (error instanceof UnautorizedError) {
    clearSessionCookie(response);
    response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });
  console.log("\n Erro dentro do catch do next-connect");
  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function setSessionCookie(sessionToken, response) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: true,
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

async function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: true,
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) await injectAuthenticatedUser(request);
  else injectAnonymousUser(request);
  return next();

  async function injectAuthenticatedUser(request) {
    const sessionToken = request.cookies.session_id;
    const sessionObject = await session.findOneValidByToken(sessionToken);
    const userObject = await user.findOneById(sessionObject.user_id);

    request.context = {
      ...request.context,
      user: userObject,
    };
  }

  async function injectAnonymousUser(request) {
    const anonymousUserObject = {
      features: ["read:activation_token", "create:session", "create:user"],
    };

    request.context = {
      ...request.context,
      user: anonymousUserObject,
    };
  }
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;

    if (userTryingToRequest.features.includes(feature)) return next();

    throw new ForbiddenError({
      message: "Voçê não possui permissão para executar essa ação.",
      action: `Verifique se o seu usuário possui a feature '${feature}'`,
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
