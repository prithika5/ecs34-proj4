import { useState } from "react";
import RouteForm from "./components/RouteForm.jsx";
import RouteResults from "./components/RouteResults.jsx";
import { requestRoute } from "./lib/api.js";

const defaultForm = {
  start: "aggie_works",
  end: "west_village",
  optimization: "shortest"
};

export default function App() {
  const [formState, setFormState] = useState(defaultForm);
  const [route, setRoute] = useState(null);
  const [comparisonRoute, setComparisonRoute] = useState(null);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value, type } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: type === "radio" ? value : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");
    setError("");

    if (formState.start === formState.end) {
      setRoute(null);
      setComparisonRoute(null);
      setValidationError("Start and end need to be different so the route tradeoff is meaningful.");
      return;
    }

    setLoading(true);

    try {
      const alternativeOptimization = formState.optimization === "fastest" ? "shortest" : "fastest";
      const [nextRoute, alternateRoute] = await Promise.all([
        requestRoute(formState),
        requestRoute({
          ...formState,
          optimization: alternativeOptimization
        })
      ]);

      setRoute(nextRoute);
      setComparisonRoute(alternateRoute);
    } catch (requestError) {
      setRoute(null);
      setComparisonRoute(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <img src="/logo.png" alt="RouteHacker logo" className="brand-logo" />
          <div>
            <p className="brand-kicker">RouteHacker</p>
            <p className="brand-subtitle">A Davis routing app for clear route decisions.</p>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Davis route planner</p>
          <h1>Find the shortest or fastest path across Davis.</h1>
          <p className="lede">
            RouteHacker helps you compare route options with clear totals, simple steps, and deterministic explanations.
          </p>
          <div className="feature-strip">
            <span>Shortest or fastest</span>
            <span>Davis-focused stops</span>
            <span>Deterministic explanations</span>
          </div>
        </div>
        <RouteForm
          formState={formState}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
          validationError={validationError}
        />
      </section>

      <RouteResults route={route} comparisonRoute={comparisonRoute} error={error} loading={loading} formState={formState} />
    </main>
  );
}
