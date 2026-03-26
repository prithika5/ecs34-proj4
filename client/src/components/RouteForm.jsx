import { locationOptions, optimizationModes } from "@shared/routeOptions.js";

export default function RouteForm({ formState, onChange, onSubmit, loading, validationError }) {
  const activeLocations = locationOptions.filter((location) => location.status === "active");

  return (
    <form className="route-form" onSubmit={onSubmit}>
      <div className="form-intro">
        <p className="eyebrow">Search route</p>
        <h2>Where are you headed?</h2>
        <p>{activeLocations.length} active destinations are available in the current route map.</p>
      </div>

      <div className="field-grid">
        <label>
          <span>Start</span>
          <select name="start" value={formState.start} onChange={onChange}>
            {activeLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>End</span>
          <select name="end" value={formState.end} onChange={onChange}>
            {activeLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mode-toggle">
        <legend>Optimization</legend>
        {optimizationModes.map((mode) => (
          <label key={mode.id} className={formState.optimization === mode.id ? "selected" : ""}>
            <input
              type="radio"
              name="optimization"
              value={mode.id}
              checked={formState.optimization === mode.id}
              onChange={onChange}
            />
            <span>{mode.label}</span>
            <small>{mode.description}</small>
          </label>
        ))}
      </fieldset>

      {validationError ? <p className="message error">{validationError}</p> : null}

      <div className="field-hint">
        <span className="field-hint-dot" />
        <p>Choose two different Davis locations to compare the route tradeoff.</p>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Finding best route..." : "See best route"}
      </button>
    </form>
  );
}
