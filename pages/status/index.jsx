import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAText = "Carregando...";

  if (!isLoading && data) {
    updatedAText = new Date(data.updated_at).toLocaleString("pt-BR");
  }
  return <div>Última atualização: {updatedAText}</div>;
}

function InfoDatabase() {
  const { isLoading, data } = useSWR("api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let infoDB = "Carregando...";

  if (!isLoading && data) {
    infoDB = (
      <>
        <div>{`Versão: ${data.dependencies.database.version}`}</div>
        <div>
          {`Conexões abertas: ${data.dependencies.database.opened_connections}`}
        </div>
        <div>
          {`Conexões máximas: ${data.dependencies.database.max_connections}`}
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Database</h1>
      <div>{infoDB}</div>
    </>
  );
}

export default function StatusPage() {
  return (
    <>
      <div className="rootStatus">
        <h1>Status</h1>
        <UpdatedAt />
        <hr />
        <InfoDatabase />
      </div>
    </>
  );
}
