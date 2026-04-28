function Home() {
  return (
    <main style={styles.page}>
      <section style={styles.intro} aria-labelledby="home-title">
        <p style={styles.status}>Em produção</p>
        <h1 id="home-title" style={styles.title}>
          nextlab
        </h1>
        <p style={styles.description}>
          Um laboratório de próxima geração para conectar estudantes e
          desenvolvedores de tecnologia do Cariri a projetos, oportunidades e
          experiências práticas.
        </p>
        <p style={styles.support}>
          A plataforma está em produção e segue evoluindo como um espaço para
          aprender, colaborar e construir soluções com impacto real.
        </p>
        <a style={styles.domain} href="https://www.nextlab.tec.br/">
          www.nextlab.tec.br
        </a>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "32px",
    color: "#f8fafc",
    background: "#050505",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  intro: {
    width: "min(100%, 760px)",
  },
  status: {
    width: "fit-content",
    margin: "0 0 16px",
    padding: "8px 12px",
    border: "1px solid #34d399",
    borderRadius: "999px",
    color: "#34d399",
    background: "#052e24",
    fontSize: "0.875rem",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "clamp(3rem, 13vw, 7rem)",
    lineHeight: 0.95,
  },
  description: {
    maxWidth: "720px",
    margin: "28px 0 0",
    fontSize: "clamp(1.25rem, 4vw, 2rem)",
    lineHeight: 1.25,
    fontWeight: 650,
  },
  support: {
    maxWidth: "640px",
    margin: "20px 0 0",
    color: "#cbd5e1",
    fontSize: "1.05rem",
    lineHeight: 1.7,
  },
  domain: {
    display: "inline-flex",
    marginTop: "32px",
    color: "#34d399",
    fontSize: "1rem",
    fontWeight: 700,
    textDecoration: "none",
  },
};

export default Home;
