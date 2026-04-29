import Joi from "joi";
import { ValidationError } from "infra/errors";

export default function validateRequest(object, keys) {
  object = normalizeJsonObject(object);

  let finalSchema = Joi.object().required().min(1).messages({
    "object.base": "Valor enviado deve ser do tipo object.",
    "object.min": "Objeto enviado deve ser no mínimo uma chave.",
  });

  for (const key of Object.keys(keys)) {
    const keyValidationFunction = schemas[key];
    finalSchema = finalSchema.concat(keyValidationFunction());
  }

  const { error, value } = finalSchema.validate(object, {
    escapeHtml: true,
    stripUnknown: true,
    context: {
      required: keys,
    },
  });

  if (error) {
    throw new ValidationError({
      message: error.details[0].message,
      key: error.details[0].key,
    });
  }
  return value;

  function normalizeJsonObject(object) {
    try {
      const normalizedObject = JSON.parse(JSON.stringify(object));
      return normalizedObject;
    } catch {
      throw new ValidationError({
        message: "Não foi possível interpretar o valor enviado.",
        action: "Verifique se o valor enviado é um JSON válido.",
      });
    }
  }
}

const schemas = {
  username: function () {
    return Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .trim()
        .invalid(null)
        .when("$required.username", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "any.required": `"username" é um campo obrigatório.`,
          "string.empty": `"username" não pode estar em branco.`,
          "string.base": `"username" deve ser do tipo String.`,
          "string.alphanum": `"username" deve conter apenas caracteres alfanuméricos.`,
          "string.min": `"username" deve conter no mínimo {#limit} caracteres.`,
          "string.max": `"username" deve conter no máximo {#limit} caracteres.`,
          "any.invalid": `"username" possui o valor inválido "null".`,
        }),
    });
  },

  email: function () {
    return Joi.object({
      email: Joi.string()
        .email()
        .min(7)
        .max(254)
        .lowercase()
        .trim()
        .invalid(null)
        .when("$required.email", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "any.required": `"email" é um campo obrigatório.`,
          "string.empty": `"email" não pode estar em branco.`,
          "string.base": `"email" deve ser do tipo String.`,
          "string.email": `"email" deve conter um email válido.`,
          "any.invalid": `"email" possui o valor inválido "null".`,
        }),
    });
  },

  password: function () {
    return Joi.object({
      // Why 72 in max length? https://security.stackexchange.com/a/39851
      password: Joi.string()
        .min(8)
        .max(72)
        .trim()
        .invalid(null)
        .when("$required.password", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "any.required": `"password" é um campo obrigatório.`,
          "string.empty": `"password" não pode estar em branco.`,
          "string.base": `"password" deve ser do tipo String.`,
          "string.min": `"password" deve conter no mínimo {#limit} caracteres.`,
          "string.max": `"password" deve conter no máximo {#limit} caracteres.`,
          "any.invalid": `"password" possui o valor inválido "null".`,
        }),
    });
  },
};
