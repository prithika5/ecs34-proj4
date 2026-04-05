import { startTransition, useMemo, useRef, useState } from "react";
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
  const [route, setRoute] = useState(null);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(new Map());
  const requestRef = useRef(null);

  const startLocation = getLocationOptionById(formState.start);
  const endLocation = getLocationOptionById(formState.end);

  function updateLocation(field, locationId) {
    setValidationError("");
    setFormState((current) => ({
      ...current,
      [field]: locationId
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");
    setError("");

    if (formState.start === formState.end) {
      setRoute(null);
      setValidationError("Start and destination must be different.");
      return;
    }

    requestRef.current?.abort();

    const controller = new AbortController();
    const cacheKey = JSON.stringify(formState);
    const cachedRoute = cacheRef.current.get(cacheKey);

    if (cachedRoute) {
      startTransition(() => {
        setRoute(cachedRoute);
        setError("");
      });
      return;
    }

    requestRef.current = controller;
    setLoading(true);

    try {
      const nextRoute = await requestRoute(formState, {
        signal: controller.signal
      });

      cacheRef.current.set(cacheKey, nextRoute);

      startTransition(() => {
        setRoute(nextRoute);
        setError("");
      });
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }

      startTransition(() => {
        setRoute(null);
        setError(requestError.message);
      });
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <main className="app-shell">
      <MapView startLocation={startLocation} endLocation={endLocation} route={route} loading={loading} />

      <div className="app-layout">
        <RouteForm
          startLocation={startLocation}
          endLocation={endLocation}
          locations={activeLocations}
          optimization={formState.optimization}
          loading={loading}
          validationError={validationError}
          onLocationSelect={updateLocation}
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

        <RouteResults route={route} error={error} loading={loading} formState={formState} />
      </div>
    </main>
  );
}
