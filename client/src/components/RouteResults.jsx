import { useEffect, useState } from "react";
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
  const [navigationActive, setNavigationActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [locationStatus, setLocationStatus] = useState("Location idle");

  useEffect(() => {
    setNavigationActive(false);
    setCurrentStepIndex(0);
    setLocationStatus("Location idle");
  }, [route?.summary, route?.optimization]);

  useEffect(() => {
    if (!navigationActive) {
      return;
    }

    if (!globalThis.navigator?.geolocation) {
      setLocationStatus("Location unavailable in this browser");
      return;
    }

    setLocationStatus("Checking current location");

    globalThis.navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus(
          `Location ready near ${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`
        );
      },
      () => {
        setLocationStatus("Location permission not granted");
      },
      { enableHighAccuracy: false, timeout: 4000 }
    );
  }, [navigationActive]);

  if (loading) {
    return (
      <section className="results-shell">
        <section className="results-panel empty">
          <div className="status-block">
            <span className="status-pulse" />
            <p className="eyebrow">Finding route</p>
            <h2>Checking the best path now.</h2>
            <p>Crunching graph weights and route tradeoffs.</p>
          </div>
        </section>
      </section>
    );
  }

  if (error) {
    return (
      <section className="results-shell">
        <section className="results-panel">
          <p className="eyebrow">Route status</p>
          <h2>We could not build this route.</h2>
          <p className="message error">{error}</p>
        </section>
      </section>
    );
  }

  if (!route) {
    return (
      <section className="results-shell">
        <section className="results-panel empty">
          <p className="eyebrow">Route preview</p>
          <h2>Your route will appear here.</h2>
          <p>Search a trip to see the summary, compare card, and step timeline.</p>
        </section>
      </section>
    );
  }

  const currentStep = route.steps[currentStepIndex];
  const navigationComplete = currentStepIndex >= route.steps.length - 1;

  return (
    <section className="results-shell">
      <section className="results-panel summary-card">
        <p className="eyebrow">Route summary</p>
        <div className="result-heading">
          <div>
            <h2>{route.summary}</h2>
            <p className="result-subtitle">
              {startLocation?.label} to {endLocation?.label}
            </p>
          </div>
          <span className={`mode-pill ${route.optimization}`}>{formatMode(route.optimization)}</span>
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
            <span>Mode</span>
            <strong>{formatMode(route.optimization)}</strong>
          </article>
        </div>
      </section>

      {comparisonRoute ? (
        <section className="results-panel comparison-card">
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
        </section>
      ) : null}

      <section className="results-panel explanation-card">
        <p className="eyebrow">Explanation</p>
        <p>{route.explanation}</p>
        {route.highlights ? <p className="explanation-subcopy">{route.highlights.campusFeel}</p> : null}
      </section>

      <section className="results-panel navigation-card">
        <div className="navigation-header">
          <div>
            <p className="eyebrow">Navigation mode</p>
            <h3>{navigationActive ? "Guided navigation is active." : "Step through the route one instruction at a time."}</h3>
          </div>
          <span className={`nav-status-pill ${navigationActive ? "live" : "idle"}`}>
            {navigationActive ? "Active" : "Standby"}
          </span>
        </div>

        <div className="navigation-meta">
          <span>
            Step {Math.min(currentStepIndex + 1, route.steps.length)} of {route.steps.length}
          </span>
          <span>{locationStatus}</span>
        </div>

        {navigationActive ? (
          <div className="navigation-step">
            <CuteCampusIcon variant={getModeIcon(currentStep.mode)} className="navigation-step-icon" />
            <div>
              <strong>{currentStep.instruction}</strong>
              <p>
                {formatMode(currentStep.mode)} · {currentStep.distance} · {currentStep.time}
              </p>
            </div>
          </div>
        ) : (
          <p className="navigation-empty">Start navigation to focus on the current instruction without scanning the full route.</p>
        )}

        <div className="navigation-actions">
          {!navigationActive ? (
            <button type="button" className="secondary-button" onClick={() => setNavigationActive(true)}>
              Start navigation
            </button>
          ) : (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCurrentStepIndex((index) => Math.max(index - 1, 0))}
                disabled={currentStepIndex === 0}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigationComplete) {
                    setNavigationActive(false);
                    setCurrentStepIndex(0);
                    setLocationStatus("Navigation finished");
                    return;
                  }

                  setCurrentStepIndex((index) => Math.min(index + 1, route.steps.length - 1));
                }}
              >
                {navigationComplete ? "Finish" : "Next step"}
              </button>
            </>
          )}
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setNavigationActive(false);
              setCurrentStepIndex(0);
              setLocationStatus("Location idle");
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="results-panel steps-card">
        <p className="eyebrow">Route steps</p>
        <ol className="step-list">
          {route.steps.map((step) => (
            <li key={step.index}>
              <span className="step-marker">{step.index}</span>
              <div className="step-card">
                <CuteCampusIcon variant={getModeIcon(step.mode)} className="step-campus-icon" />
                <strong>{step.instruction}</strong>
                <p>
                  {formatMode(step.mode)} · {step.distance} · {step.time}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
