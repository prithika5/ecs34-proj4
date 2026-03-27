import { getLocationOptionById } from "@shared/routeOptions.js";

function formatMode(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function formatOptimizationLabel(optimization) {
  return optimization === "shortest" ? "Shortest distance" : "Fastest arrival";
}

function formatInstruction(step) {
  const busMatch = step.instruction.match(/^Take Bus ([A-Za-z0-9]+) from stop \d+ to stop \d+$/);

  if (busMatch) {
    return `Ride Bus ${busMatch[1]} to the next shuttle transfer.`;
  }

  return step.instruction;
}

function getTradeoffCopy(route, comparisonRoute) {
  if (!comparisonRoute) {
    return "Best available route from the current planner run.";
  }

  const sameDistance = Math.abs((route.totals?.rawDistance || 0) - (comparisonRoute.totals?.rawDistance || 0)) < 0.01;
  const sameGeometry =
    JSON.stringify(route.geometry?.coordinates || []) === JSON.stringify(comparisonRoute.geometry?.coordinates || []);

  if (sameGeometry || sameDistance) {
    return "Both modes follow the same corridor here. The main difference is pace, not the line on the map.";
  }

  if (route.optimization === "fastest") {
    return `Fastest arrives in ${route.totals.time} instead of ${comparisonRoute.totals.time}, with a slightly longer line on the map.`;
  }

  return `Shortest keeps the trip to ${route.totals.distance} instead of ${comparisonRoute.totals.distance}, with a slower arrival.`;
}

function buildBreakdownSummary(breakdown = []) {
  if (!breakdown.length) {
    return "No mode breakdown yet.";
  }

  return breakdown
    .map((entry) => `${entry.label} ${entry.distance}`)
    .join(" · ");
}

function getPrimaryMode(route) {
  if (route.breakdown?.length) {
    return route.breakdown
      .slice()
      .sort((left, right) => {
        if ((right.rawDistance || 0) !== (left.rawDistance || 0)) {
          return (right.rawDistance || 0) - (left.rawDistance || 0);
        }

        return (right.rawTime || 0) - (left.rawTime || 0);
      })[0]?.mode;
  }

  return route.highlights?.dominantMode || "walk";
}

function getEngineLabel(engine) {
  if (engine === "cpp") {
    return "Real C++ route";
  }

  if (engine === "demo-fallback") {
    return "Fallback route";
  }

  return "Demo route";
}

function getTimeLabel(route) {
  return route.optimization === "shortest" ? "Est. walking time" : "Travel time";
}

function getWhyCopy(route, comparisonRoute) {
  const sameDistance = comparisonRoute ? Math.abs((route.totals?.rawDistance || 0) - (comparisonRoute.totals?.rawDistance || 0)) < 0.01 : false;
  const sameGeometry =
    comparisonRoute && JSON.stringify(route.geometry?.coordinates || []) === JSON.stringify(comparisonRoute.geometry?.coordinates || []);

  if (route.optimization === "shortest" && (sameGeometry || sameDistance)) {
    return "Shortest keeps the same corridor but estimates the trip as a full walking pace, which is why the time reads longer than the fastest option.";
  }

  if (route.optimization === "shortest") {
    return "Shortest minimizes total path distance. Its time is currently estimated from the compact path at walking pace.";
  }

  return route.explanation;
}

export default function RouteResults({ route, comparisonRoute, error, loading, formState }) {
  const startLocation = getLocationOptionById(formState.start);
  const endLocation = getLocationOptionById(formState.end);
  const primaryMode = getPrimaryMode(route || {});

  if (loading) {
    return (
      <aside className="floating-panel trip-panel">
        <div className="trip-card loading">
          <p className="panel-kicker">Finding route</p>
          <h2>Computing the best path.</h2>
          <p>Pulling a fresh route from the planner and shaping it for the map.</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="floating-panel trip-panel">
        <div className="trip-card error">
          <p className="panel-kicker">Route status</p>
          <h2>Trip unavailable</h2>
          <p className="message error">{error}</p>
        </div>
      </aside>
    );
  }

  if (!route) {
    return (
      <aside className="floating-panel trip-panel">
        <div className="trip-card empty">
          <p className="panel-kicker">Trip card</p>
          <h2>Select two places to preview a route.</h2>
          <p>The summary, route line, and step timeline will appear here after a search.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="floating-panel trip-panel">
      <section className="trip-card summary">
        <div className="trip-card-topline">
          <div>
            <p className="panel-kicker">Trip summary</p>
            <h2>{route.totals.time}</h2>
            <p className="trip-time-caption">{getTimeLabel(route)}</p>
          </div>
          <span className={`optimization-badge ${route.optimization}`}>{formatOptimizationLabel(route.optimization)}</span>
        </div>

        <div className="trip-summary-route">
          <div>
            <span>Start</span>
            <strong>{startLocation?.label}</strong>
          </div>
          <div className="trip-route-divider" />
          <div>
            <span>Destination</span>
            <strong>{endLocation?.label}</strong>
          </div>
        </div>

        <div className="trip-stat-grid">
          <article>
            <span>Distance</span>
            <strong>{route.totals.distance}</strong>
          </article>
          <article>
            <span>Mode</span>
            <strong>{formatMode(primaryMode)}</strong>
          </article>
        </div>

        <div className="trip-breakdown">
          <span>Mode breakdown</span>
          <p>{buildBreakdownSummary(route.breakdown)}</p>
        </div>

        <div className="trip-engine-note">
          <span>{getEngineLabel(route.engine)}</span>
          {route.fallbackReason ? <p>{route.fallbackReason}</p> : null}
        </div>
      </section>

      {comparisonRoute ? (
        <section className="trip-card compare">
          <div className="compact-card-header">
            <p className="panel-kicker">Compare modes</p>
            <span>{comparisonRoute.totals.time}</span>
          </div>
          <div className="compare-grid">
            <article>
              <span>Selected</span>
              <strong>{formatOptimizationLabel(route.optimization)}</strong>
            </article>
            <article>
              <span>Alternate</span>
              <strong>{formatOptimizationLabel(comparisonRoute.optimization)}</strong>
            </article>
          </div>
          <p className="compact-note">{getTradeoffCopy(route, comparisonRoute)}</p>
        </section>
      ) : null}

      <section className="trip-card why">
        <div className="compact-card-header">
          <p className="panel-kicker">Why this route?</p>
          <span>{route.steps.length} steps</span>
        </div>
        <p>{getWhyCopy(route, comparisonRoute)}</p>
      </section>

      <section className="trip-card steps">
        <div className="compact-card-header">
          <p className="panel-kicker">Route steps</p>
          <span>{route.summary}</span>
        </div>
        <ol className="timeline">
          {route.steps.map((step) => (
            <li key={step.index} className="timeline-step">
              <span className={`timeline-index ${step.mode}`}>{step.index}</span>
              <div className="timeline-body">
                <div className="timeline-row">
                  <span className="timeline-mode">{formatMode(step.mode)}</span>
                  <span className="timeline-meta">{[step.distance, step.time].filter(Boolean).join(" · ") || "Transit segment"}</span>
                </div>
                <strong>{formatInstruction(step)}</strong>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
