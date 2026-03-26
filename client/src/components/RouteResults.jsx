import { getLocationOptionById } from "@shared/routeOptions.js";
import CuteCampusIcon from "./CuteCampusIcon.jsx";

function formatMode(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getModeIcon(mode) {
  if (mode === "bike") {
    return "bike";
  }

  if (mode === "shuttle") {
    return "shuttle";
  }

  return "walk";
}

export default function RouteResults({ route, comparisonRoute, error, loading, formState }) {
  const startLocation = getLocationOptionById(formState?.start);
  const endLocation = getLocationOptionById(formState?.end);

  if (loading) {
    return (
      <section className="results-panel loading">
        <div className="status-block">
          <span className="status-pulse" />
          <p className="eyebrow">Finding route</p>
          <h2>Checking the best path now.</h2>
          <p>Crunching graph weights and route tradeoffs.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="results-panel">
        <p className="eyebrow">Route status</p>
        <h2>We could not build this route.</h2>
        <p className="message error">{error}</p>
      </section>
    );
  }

  if (!route) {
    return (
      <section className="results-panel empty">
        <p className="eyebrow">Route preview</p>
        <h2>Your trip summary will appear here.</h2>
        <p>
          Pick a start, destination, and route mode. We will return a clean summary, step cards, and the tradeoff
          behind the recommendation.
        </p>
      </section>
    );
  }

  return (
    <section className="results-panel">
      <p className="eyebrow">Computed route</p>
      <div className="result-heading">
        <div>
          <h2>{route.summary}</h2>
          <p className="result-subtitle">A deterministic {route.optimization} recommendation built from the current route graph.</p>
        </div>
        <span className={`mode-pill ${route.optimization}`}>{formatMode(route.optimization)}</span>
      </div>
      <div className="route-places">
        <article>
          <CuteCampusIcon variant={startLocation?.icon} className="preview-campus-icon icon-bob" />
          <div>
            <span>Start</span>
            <strong>{startLocation?.label}</strong>
          </div>
        </article>
        <article>
          <CuteCampusIcon variant={endLocation?.icon} className="preview-campus-icon icon-float" />
          <div>
            <span>Destination</span>
            <strong>{endLocation?.label}</strong>
          </div>
        </article>
      </div>
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
      {route.highlights ? (
        <div className="highlights-strip">
          <article>
            <span>Dominant mode</span>
            <strong>{formatMode(route.highlights.dominantMode)}</strong>
          </article>
          <article>
            <span>Step count</span>
            <strong>{route.highlights.stepCount}</strong>
          </article>
          <article>
            <span>Route read</span>
            <strong>{route.highlights.tradeoffLabel}</strong>
          </article>
        </div>
      ) : null}

      {comparisonRoute ? (
        <div className="comparison-card">
          <p className="eyebrow">Compare modes</p>
          <div className="comparison-grid">
            <article className="comparison-primary">
              <span>Selected</span>
              <strong>{formatMode(route.optimization)}</strong>
              <p>
                {route.totals.distance} · {route.totals.time}
              </p>
            </article>
            <article>
              <span>Alternative</span>
              <strong>{formatMode(comparisonRoute.optimization)}</strong>
              <p>
                {comparisonRoute.totals.distance} · {comparisonRoute.totals.time}
              </p>
            </article>
          </div>
          <p className="comparison-note">
            {route.optimization === "fastest"
              ? `Fastest saves time, while ${comparisonRoute.optimization} keeps the trip tighter on mileage.`
              : `Shortest reduces mileage, while ${comparisonRoute.optimization} gets you there faster.`}
          </p>
        </div>
      ) : null}

      <div className="explanation-card">
        <p className="eyebrow">Explanation engine</p>
        <p>{route.explanation}</p>
        {route.highlights ? <p className="explanation-subcopy">{route.highlights.campusFeel}</p> : null}
      </div>

      <ol className="step-list">
        {route.steps.map((step) => (
          <li key={step.index}>
            <span className="step-marker">{step.index}</span>
            <div className="step-card">
              <CuteCampusIcon variant={getModeIcon(step.mode)} className="step-campus-icon icon-bob" />
              <strong>{step.instruction}</strong>
              <p>
                {formatMode(step.mode)} · {step.distance} · {step.time}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
