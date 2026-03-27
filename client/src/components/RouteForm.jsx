import { optimizationModes } from "@shared/routeOptions.js";
import LocationSearchField from "./LocationSearchField.jsx";

export default function RouteForm({
  startLocation,
  endLocation,
  locations,
  optimization,
  activeField,
  loading,
  validationError,
  onLocationSelect,
  onFieldActivate,
  onOptimizationChange,
  onSwap,
  onSubmit
}) {
  return (
    <section className="floating-panel planner-panel">
      <div className="planner-panel-header">
        <div>
          <p className="panel-kicker">Route planner</p>
          <h1>Find a Davis trip.</h1>
        </div>
        <span className="planner-engine-pill">Real planner</span>
      </div>

      <form className="planner-form" onSubmit={onSubmit}>
        <div className="planner-fields">
          <LocationSearchField
            label="Start"
            value={startLocation}
            locations={locations}
            active={activeField === "start"}
            onActivate={() => onFieldActivate("start")}
            onSelect={(locationId) => onLocationSelect("start", locationId)}
          />

          <button type="button" className="swap-button" onClick={onSwap} aria-label="Swap start and destination">
            Swap
          </button>

          <LocationSearchField
            label="Destination"
            value={endLocation}
            locations={locations}
            active={activeField === "end"}
            onActivate={() => onFieldActivate("end")}
            onSelect={(locationId) => onLocationSelect("end", locationId)}
          />
        </div>

        <div className="mode-control">
          <span>Optimization</span>
          <div className="mode-segmented" role="radiogroup" aria-label="Optimization">
            {optimizationModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={optimization === mode.id ? "selected" : ""}
                aria-pressed={optimization === mode.id}
                onClick={() => onOptimizationChange(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="planner-meta-row">
          <p>Search by name or tap the map to fill the highlighted field.</p>
          <span>{activeField === "end" ? "Picking destination" : "Picking start"}</span>
        </div>

        {validationError ? <p className="message error">{validationError}</p> : null}

        <button type="submit" className="primary-cta" disabled={loading}>
          {loading ? "Finding route..." : "Get route"}
        </button>
      </form>
    </section>
  );
}
