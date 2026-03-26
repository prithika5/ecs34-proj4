import { useState } from "react";
import RouteForm from "./components/RouteForm.jsx";
import RouteResults from "./components/RouteResults.jsx";
import { requestRoute } from "./lib/api.js";

const highlightScenarios = [
  {
    title: "Fast commute",
    copy: "Use shuttle-heavy routing when travel time matters more than mileage.",
    accent: "Shuttle bias"
  },
  {
    title: "Compact path",
    copy: "Keep the route tight when the shortest physical distance is the real goal.",
    accent: "Distance bias"
  },
  {
    title: "Transparent tradeoffs",
    copy: "Every result explains why the engine preferred one trip over another.",
    accent: "Explainability"
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
      setValidationError("Start and end need to be different so the route tradeoff is meaningful.");
      return;
    }

    setLoading(true);

    try {
      const nextRoute = await requestRoute(formState);
      setRoute(nextRoute);
    } catch (requestError) {
      setRoute(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">RouteHacker MVP</p>
          <h1>Deterministic routing with startup-grade presentation.</h1>
          <p className="lede">
            RouteHacker turns graph logic into a product demo: shortest and fastest trips, transparent tradeoffs, and
            polished feedback for every state.
          </p>
          <div className="feature-strip">
            <span>Shortest vs fastest</span>
            <span>Deterministic explanations</span>
            <span>Responsive route summaries</span>
          </div>
          <div className="scenario-strip">
            {highlightScenarios.map((scenario) => (
              <article key={scenario.title}>
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
        <RouteResults route={route} error={error} loading={loading} />

        <aside className="notes-panel">
          <p className="eyebrow">Why this feels different</p>
          <h2>Built like an MVP, not a coursework screenshot.</h2>
          <p>
            The backend owns the routing algorithm directly, so the interface can explain why a faster trip might be
            longer, or why a shorter path slows you down.
          </p>
          <div className="mini-cards">
            <article>
              <strong>Validation</strong>
              <p>Clear errors for invalid locations, same-point trips, and disconnected routes.</p>
            </article>
            <article>
              <strong>Extensible graph</strong>
              <p>Seed data is easy to expand into neighborhood, campus, or transit-focused route maps.</p>
            </article>
          </div>
          <div className="product-note">
            <p className="eyebrow">Launch posture</p>
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
