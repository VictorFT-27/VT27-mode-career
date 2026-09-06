export function HomePage() {
  return (
    <main className="welcome" aria-labelledby="welcome-title">
      <p className="eyebrow">VT27 · Simulador de carreira</p>
      <h1 id="welcome-title">O primeiro passo de uma nova carreira.</h1>
      <p className="description">
        Projeto inicializado com sucesso. A base está pronta para começarmos
        o desenvolvimento do simulador.
      </p>
      <p className="status"><span aria-hidden="true" />Ambiente preparado</p>
      <footer>Versão inicial · Funcionalidades do jogo em desenvolvimento</footer>
    </main>
  )
}
