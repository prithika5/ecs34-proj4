import { locationOptions, optimizationModes, transportationModes } from "@shared/routeOptions.js";

export default function RouteForm({ formState, onChange, onSubmit, loading, validationError }) {
  const activeLocations = locationOptions.filter((location) => location.status === "active");
  const handleSwap = () => {
    onChange({ target: { name: "start", value: formState.end } });
    onChange({ target: { name: "end", value: formState.start } });
  };

  return (
    <form className="route-form card" onSubmit={onSubmit}>
      <div className="form-intro">
        <p className="eyebrow">Planner</p>
        <h2>Search a route</h2>
        <p className="form-helper">Pick two stops and choose the route mode that matters most.</p>
      </div>

      <div className="route-inputs">
        <div className="field-grid compact">
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

        <button type="button" className="swap-button" onClick={handleSwap} aria-label="Swap start and end">
          Swap
        </button>
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
        <small>Choose the shortest trip or the fastest arrival.</small>
      </fieldset>

      <label className="transport-preference">
        <span>Transportation</span>
        <select name="modePreference" aria-label="Transportation" value={formState.modePreference} onChange={onChange}>
          {transportationModes.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>
        <small>Optional filter if you want to stay with one mode.</small>
      </label>

      {validationError ? <p className="message error">{validationError}</p> : null}

      <button type="submit" disabled={loading}>
        {loading ? "Finding best route..." : "See best route"}
      </button>
    </form>
  );
}
