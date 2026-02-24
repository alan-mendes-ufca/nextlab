import database from "../infra/database.js";
import { NotFoundError, ValitationError } from "../infra/errors.js";
import password from "../models/password.js";

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  await hashPasswordInObject(userInputValues);
  injectDefaultFeaturesObject(userInputValues);

  const newUser = runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const result = await database.query({
      text: `
    INSERT INTO 
      users (username, email, password, features) 
    VALUES 
      ($1, $2, $3, $4)
    RETURNING
      *
    ;`,

      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.features,
      ],
    });
    return result.rows[0];
  }

  function injectDefaultFeaturesObject(userInputValues) {
    userInputValues.features = ["read:activation_token"];
  }

  async function hashPasswordInObject(userInputValues) {
    const hashedPassword = await password.hash(userInputValues.password);
    userInputValues.password = hashedPassword;
  }
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    userInputValues.password = await password.hash(userInputValues.password);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const upatedUser = await runUpdateQuery(userWithNewValues);
  return upatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const result = await database.query({
      text: `
    UPDATE 
      users
    SET 
      username = $2, 
      email = $3,
      password = $4,
      updated_at = timezone('utc', now())
    WHERE
      id = $1
    RETURNING
      *
    ;
    `,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return result.rows[0];
  }
}

async function findOneByUsername(username) {
  const userFound = runSelectQuery(username);
  return userFound;
  async function runSelectQuery(username) {
    const response = await database.query({
      text: `
    SELECT 
      * 
    FROM 
      users 
    WHERE 
      LOWER(username) = LOWER($1)
    LIMIT
      1
    ;`,
      values: [username],
    });
    if (!response.rows.length > 0) {
      throw new NotFoundError({
        message: "Usuário não encontrado.",
        action: "Utilize outro username para realizar esta operação.",
      });
    }
    return response.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = runSelectQuery(email);
  return userFound;
  async function runSelectQuery(email) {
    const response = await database.query({
      text: `
    SELECT 
      * 
    FROM 
      users 
    WHERE 
      LOWER(email) = LOWER($1)
    LIMIT
      1
    ;`,
      values: [email],
    });
    if (!response.rows.length > 0) {
      throw new NotFoundError({});
    }
    return response.rows[0];
  }
}

async function findOneById(id) {
  const userFound = runSelectQuery(id);
  return userFound;

  async function runSelectQuery(id) {
    const response = await database.query({
      text: `
    SELECT 
      * 
    FROM 
      users 
    WHERE 
      id = $1
    LIMIT
      1
    ;`,
      values: [id],
    });

    if (!response.rows.length > 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
      });
    }
    return response.rows[0];
  }
}

async function validateUniqueEmail(email) {
  if (!email) {
    const valitationError = new ValitationError({
      message: "Email não informado.",
      action: "Utilize um email para realizar o cadastro.",
    });
    throw valitationError;
  }
  const result = await database.query({
    text: `
    SELECT 
      email 
    FROM
      users
    WHERE
      LOWER(email) = LOWER($1)
    ;`,

    values: [email],
  });
  if (result.rowCount > 0) {
    const valitationError = new ValitationError({
      message: "Email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar esta operação.",
    });
    throw valitationError;
  }
}

async function validateUniqueUsername(username) {
  if (!username) {
    const valitationError = new ValitationError({
      message: "Username não informado.",
      action: "Utilize um username para realizar o cadastro.",
    });
    throw valitationError;
  }
  const result = await database.query({
    text: `
    SELECT 
      username 
    FROM
      users
    WHERE
      LOWER(username) = LOWER($1)
    ;`,

    values: [username],
  });
  if (result.rowCount > 0) {
    const valitationError = new ValitationError({
      message: "Username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar esta operação.",
    });
    throw valitationError;
  }
}

const user = {
  create,
  update,
  findOneByUsername,
  findOneByEmail,
  findOneById,
};
export default user;
