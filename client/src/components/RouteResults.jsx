import { getLocationOptionById } from "@shared/routeOptions.js";

function formatMode(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function summarizeModes(route) {
  const labels = (route.breakdown || []).map((entry) => entry.label);
  return labels.length ? labels.join(" + ") : formatMode(route.highlights?.dominantMode || "walk");
}

function normalizeInstruction(step) {
  const instruction = step.instruction || "";

  if (instruction.startsWith("Take the ")) {
    return instruction.replace(/^Take the /, "");
  }

  if (instruction.startsWith("Take Bus ")) {
    return instruction.replace(/^Take /, "");
  }

  return instruction;
}

function LoadingCard() {
  return (
    <aside className="panel results-panel">
      <div className="results-loading-header">
        <span className="loading-dot" aria-hidden="true" />
        <p>Loading route...</p>
      </div>

      <section className="result-card summary-card skeleton-card" aria-hidden="true">
        <div className="skeleton skeleton-title" />
        <div className="metric-grid">
          <div className="metric-card">
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-value" />
          </div>
          <div className="metric-card">
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-value" />
          </div>
          <div className="metric-card">
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-value" />
          </div>
        </div>
      </section>

      <section className="result-card skeleton-card" aria-hidden="true">
        <div className="skeleton skeleton-step" />
        <div className="skeleton skeleton-step" />
        <div className="skeleton skeleton-step short" />
      </section>
    </aside>
  );
}

export default function RouteResults({ route, error, loading, formState }) {
  const startLocation = getLocationOptionById(formState.start);
  const endLocation = getLocationOptionById(formState.end);

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return (
      <aside className="panel results-panel">
        <section className="result-card state-card">
          <p className="eyebrow">Route</p>
          <h2>No route found</h2>
          <p className="support-copy">{error}</p>
        </section>
      </aside>
    );
  }

  if (!route) {
    return (
      <aside className="panel results-panel">
        <section className="result-card state-card">
          <p className="eyebrow">Ready</p>
          <h2>Plan a trip</h2>
          <p className="support-copy">Choose a start and destination to see the best route.</p>
        </section>
      </aside>
    );
  }

  return (
    <aside className="panel results-panel">
      <section className="result-card summary-card">
        <div className="summary-heading">
          <div>
            <p className="eyebrow">{route.optimization === "fastest" ? "Fastest" : "Shortest"}</p>
            <h2>
              {startLocation?.label} to {endLocation?.label}
            </h2>
          </div>
          <span className="summary-badge">{route.steps.length} steps</span>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span>Time</span>
            <strong>{route.totals.time}</strong>
          </article>
          <article className="metric-card">
            <span>Distance</span>
            <strong>{route.totals.distance}</strong>
          </article>
          <article className="metric-card">
            <span>Modes</span>
            <strong>{summarizeModes(route)}</strong>
          </article>
        </div>
      </section>

      <section className="result-card">
        <div className="steps-header">
          <p className="eyebrow">Directions</p>
        </div>
        <ol className="steps-list">
          {route.steps.map((step) => (
            <li key={step.index} className="step-row">
              <span className={`step-index ${step.mode}`}>{step.index}</span>
              <div className="step-copy">
                <div className="step-meta">
                  <span>{formatMode(step.mode)}</span>
                  <span>{[step.distance, step.time].filter(Boolean).join(" · ")}</span>
                </div>
                <strong>{normalizeInstruction(step)}</strong>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
