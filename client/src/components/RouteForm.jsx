import { locationOptions, optimizationModes } from "@shared/routeOptions.js";

export default function RouteForm({ formState, onChange, onSubmit, loading, validationError }) {
  const activeLocations = locationOptions.filter((location) => location.status === "active");

  return (
    <form className="route-form card" onSubmit={onSubmit}>
      <div className="form-intro">
        <p className="eyebrow">Planner</p>
        <h2>Search a route</h2>
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
        <div className="mode-segmented">
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
            </label>
          ))}
        </div>
      </fieldset>

      {validationError ? <p className="message error">{validationError}</p> : null}

      <button type="submit" disabled={loading}>
        {loading ? "Finding best route..." : "See best route"}
      </button>
    </form>
  );
}
