// Used by mail model to concatenate valid API URL and token activation

function getOrigin() {
  if (["test", "development"].includes(process.env.NODE_ENV))
    return "http://localhost:3000";

  if (process.env.VERCEL_ENV === "preview")
    return `https://${process.env.VERCEL_URL}`;

  return "https://www.nextlab.tec.br";
}

const webServer = {
  origin: getOrigin(),
};

export default webServer;
