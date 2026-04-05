import { optimizationModes } from "@shared/routeOptions.js";
import LocationSearchField from "./LocationSearchField.jsx";

export default function RouteForm({
  startLocation,
  endLocation,
  locations,
  optimization,
  loading,
  validationError,
  onLocationSelect,
  onOptimizationChange,
  onSwap,
  onSubmit
}) {
  return (
    <section className="panel control-panel">
      <div className="brand-block">
        <img src="/logo.png" alt="RouteHacker logo" className="brand-logo" />
        <div>
          <p className="brand-title">RouteHacker</p>
          <p className="brand-subtitle">UC Davis transportation planner</p>
        </div>
      </div>

      <form className="planner-form" onSubmit={onSubmit}>
        <LocationSearchField
          label="Start"
          value={startLocation}
          locations={locations}
          onSelect={(locationId) => onLocationSelect("start", locationId)}
        />

        <button type="button" className="swap-button" onClick={onSwap} aria-label="Swap start and destination">
          Swap
        </button>

        <LocationSearchField
          label="Destination"
          value={endLocation}
          locations={locations}
          onSelect={(locationId) => onLocationSelect("end", locationId)}
        />

        <div className="mode-control">
          <span className="field-label">Route</span>
          <div className="mode-segmented" role="radiogroup" aria-label="Optimization">
            {optimizationModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={optimization === mode.id ? "selected" : ""}
                aria-pressed={optimization === mode.id}
                onClick={() => onOptimizationChange(mode.id)}
              >
                {mode.id === "fastest" ? "Fastest" : "Shortest"}
              </button>
            ))}
          </div>
        </div>

        {validationError ? <p className="inline-message error">{validationError}</p> : null}

        <button type="submit" className="primary-cta" disabled={loading}>
          <span className={loading ? "button-spinner" : "button-spinner hidden"} aria-hidden="true" />
          {loading ? "Loading route..." : "Get Route"}
        </button>
      </form>
    </section>
  );
}
