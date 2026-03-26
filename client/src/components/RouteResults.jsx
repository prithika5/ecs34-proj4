export default function RouteResults({ route, error, loading }) {
  if (loading) {
    return <section className="results-panel loading">Crunching graph weights and route tradeoffs...</section>;
  }

  if (error) {
    return (
      <section className="results-panel">
        <p className="eyebrow">Route status</p>
        <h2>We could not build that trip.</h2>
        <p className="message error">{error}</p>
      </section>
    );
  }

  if (!route) {
    return (
      <section className="results-panel empty">
        <p className="eyebrow">Route preview</p>
        <h2>Shortest and fastest decisions will show up here.</h2>
        <p>
          Pick two locations, choose an optimization mode, and RouteHacker will explain the tradeoff instead of
          hiding the logic.
        </p>
      </section>
    );
  }

  return (
    <section className="results-panel">
      <p className="eyebrow">Computed route</p>
      <h2>{route.summary}</h2>
      <div className="stats">
        <article>
          <span>Total distance</span>
          <strong>{route.totals.distance}</strong>
        </article>
        <article>
          <span>Total time</span>
          <strong>{route.totals.time}</strong>
        </article>
        <article>
          <span>Optimization</span>
          <strong>{route.optimization}</strong>
        </article>
      </div>

      <div className="explanation-card">
        <p className="eyebrow">Explanation engine</p>
        <p>{route.explanation}</p>
      </div>

      <ol className="step-list">
        {route.steps.map((step) => (
          <li key={step.index}>
            <div>
              <strong>{step.instruction}</strong>
              <p>
                {step.mode} · {step.distance} · {step.time}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
