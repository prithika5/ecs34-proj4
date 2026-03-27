import { useMemo, useState } from "react";
import { getLocationOptionById, locationOptions } from "@shared/routeOptions.js";
import MapView from "./components/MapView.jsx";
import RouteForm from "./components/RouteForm.jsx";
import RouteResults from "./components/RouteResults.jsx";
import { requestRoute } from "./lib/api.js";

const defaultForm = {
  start: "aggie_works",
  end: "west_village",
  optimization: "fastest",
  modePreference: "any"
};

export default function App() {
  const activeLocations = useMemo(() => locationOptions.filter((location) => location.status === "active"), []);
  const [formState, setFormState] = useState(defaultForm);
  const [activeField, setActiveField] = useState("start");
  const [route, setRoute] = useState(null);
  const [comparisonRoute, setComparisonRoute] = useState(null);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);

  const startLocation = getLocationOptionById(formState.start);
  const endLocation = getLocationOptionById(formState.end);

  function updateLocation(field, locationId) {
    setValidationError("");
    setFormState((current) => ({
      ...current,
      [field]: locationId
    }));
  }

  function handleMapPick(locationId) {
    const field = activeField;
    updateLocation(field, locationId);
    setActiveField(field === "start" ? "end" : "start");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");
    setError("");

    if (formState.start === formState.end) {
      setRoute(null);
      setComparisonRoute(null);
      setValidationError("Start and destination need to be different.");
      return;
    }

    setLoading(true);

    try {
      const alternateOptimization = formState.optimization === "fastest" ? "shortest" : "fastest";
      const [nextRoute, alternateRoute] = await Promise.all([
        requestRoute(formState),
        requestRoute({
          ...formState,
          optimization: alternateOptimization
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
    <main className="map-app-shell">
      <MapView
        locations={activeLocations}
        startLocation={startLocation}
        endLocation={endLocation}
        route={route}
        activeField={activeField}
        onMapPick={handleMapPick}
      />

      <header className="floating-panel app-topbar">
        <div className="brand-lockup">
          <img src="/logo.png" alt="RouteHacker logo" className="brand-logo" />
          <div>
            <p className="brand-title">RouteHacker</p>
            <p className="brand-subtitle">UC Davis transportation planner</p>
          </div>
        </div>
        <span className="topbar-chip">Live map</span>
      </header>

      <RouteForm
        startLocation={startLocation}
        endLocation={endLocation}
        locations={activeLocations}
        optimization={formState.optimization}
        activeField={activeField}
        loading={loading}
        validationError={validationError}
        onLocationSelect={updateLocation}
        onFieldActivate={setActiveField}
        onOptimizationChange={(optimization) =>
          setFormState((current) => ({
            ...current,
            optimization
          }))
        }
        onSwap={() =>
          setFormState((current) => ({
            ...current,
            start: current.end,
            end: current.start
          }))
        }
        onSubmit={handleSubmit}
      />

      <RouteResults route={route} comparisonRoute={comparisonRoute} error={error} loading={loading} formState={formState} />
    </main>
  );
}
