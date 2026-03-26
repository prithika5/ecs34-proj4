import { useState } from "react";
import RouteForm from "./components/RouteForm.jsx";
import RouteResults from "./components/RouteResults.jsx";
import CuteCampusIcon from "./components/CuteCampusIcon.jsx";
import { requestRoute } from "./lib/api.js";

const highlightScenarios = [
  {
    title: "Fast pickup feel",
    copy: "Large controls and short summaries keep the route readable in seconds.",
    accent: "Speed first"
  },
  {
    title: "Clear decisions",
    copy: "Shortest and fastest modes stay easy to compare without adding clutter.",
    accent: "Practical"
  },
  {
    title: "Trusted output",
    copy: "Every route includes deterministic explanation copy instead of a black box answer.",
    accent: "Reliable"
  }
];

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
            <p className="brand-subtitle">Routing intelligence with a premium Davis ride-booking feel.</p>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Premium routing interface</p>
          <h1>Fast to scan. Easy to trust. Built for motion.</h1>
          <p className="lede">
            RouteHacker presents deterministic routing in a clean transportation-style interface with strong hierarchy,
            fast decision-making, and polished route feedback.
          </p>
          <div className="feature-strip">
            <span>Shortest or fastest</span>
            <span>Readable in under 3 seconds</span>
            <span>Deterministic explanations</span>
          </div>
          <div className="scenario-strip">
            {highlightScenarios.map((scenario) => (
              <article key={scenario.title}>
                <CuteCampusIcon variant="cow_lab" className="mini-campus-icon icon-float" />
                <p>{scenario.accent}</p>
                <strong>{scenario.title}</strong>
                <span>{scenario.copy}</span>
              </article>
            ))}
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

      <section className="content-grid">
        <RouteResults
          route={route}
          comparisonRoute={comparisonRoute}
          error={error}
          loading={loading}
          formState={formState}
        />

        <aside className="notes-panel">
          <p className="eyebrow">Why it works</p>
          <h2>Modern transportation UI without dashboard clutter.</h2>
          <p>
            The backend owns the routing algorithm directly, so the interface can explain why a faster trip might be
            longer, or why a shorter route takes more time.
          </p>
          <div className="mini-cards">
            <article>
              <CuteCampusIcon variant="shuttle" className="mini-campus-icon icon-bob" />
              <strong>Practical feedback</strong>
              <p>Large controls, simple route summaries, and clear validation keep the flow calm and fast.</p>
            </article>
            <article>
              <CuteCampusIcon variant="bike" className="mini-campus-icon icon-wiggle" />
              <strong>Expandable engine</strong>
              <p>Seed graph data can grow into larger neighborhood, campus, or transit route maps.</p>
            </article>
            <article>
              <CuteCampusIcon variant="union" className="mini-campus-icon icon-float" />
              <strong>Instant comparison</strong>
              <p>The alternate optimization appears beside the selected route so tradeoffs are obvious immediately.</p>
            </article>
          </div>
          <div className="product-note">
            <p className="eyebrow">Ready to ship</p>
            <p>
              Dev-container ready, tested on both client and server, and structured so Vercel and Render deployment can
              be added without reshaping the app.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
