import { useEffect, useMemo, useRef } from "react";

const fallbackCenter = {
  latitude: 38.5425,
  longitude: -121.7565
};

function findNearestLocation(locations, longitude, latitude) {
  let nearest = locations[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const location of locations) {
    const longitudeDelta = location.coordinates.longitude - longitude;
    const latitudeDelta = location.coordinates.latitude - latitude;
    const score = longitudeDelta * longitudeDelta + latitudeDelta * latitudeDelta;

    if (score < bestScore) {
      nearest = location;
      bestScore = score;
    }
  }

  return nearest;
}

function getBounds(points) {
  if (!points.length) {
    return null;
  }

  return points.reduce(
    (bounds, [longitude, latitude]) => ({
      west: Math.min(bounds.west, longitude),
      east: Math.max(bounds.east, longitude),
      south: Math.min(bounds.south, latitude),
      north: Math.max(bounds.north, latitude)
    }),
    {
      west: points[0][0],
      east: points[0][0],
      south: points[0][1],
      north: points[0][1]
    }
  );
}

export default function MapView({
  locations,
  startLocation,
  endLocation,
  route,
  activeField,
  onMapPick
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxRef = useRef(null);
  const markersRef = useRef([]);
  const loadedRef = useRef(false);
  const mapToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const interactiveReady = Boolean(mapToken) && import.meta.env.MODE !== "test";

  const routeCoordinates = route?.geometry?.coordinates || [];
  const selectedPoints = useMemo(() => {
    const points = [];

    if (startLocation?.coordinates) {
      points.push([startLocation.coordinates.longitude, startLocation.coordinates.latitude]);
    }

    if (endLocation?.coordinates) {
      points.push([endLocation.coordinates.longitude, endLocation.coordinates.latitude]);
    }

    return points;
  }, [endLocation?.coordinates, startLocation?.coordinates]);

  useEffect(() => {
    if (!interactiveReady || !containerRef.current) {
      return undefined;
    }

    let removed = false;

    async function initializeMap() {
      const mapboxModule = await import("mapbox-gl");

      if (removed || !containerRef.current) {
        return;
      }

      const mapboxgl = mapboxModule.default;
      mapboxgl.accessToken = mapToken;
      mapboxRef.current = mapboxgl;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [fallbackCenter.longitude, fallbackCenter.latitude],
        zoom: 13.7,
        attributionControl: false
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
      map.on("load", () => {
        if (removed) {
          return;
        }

        loadedRef.current = true;
        map.addSource("route-line", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: []
            }
          }
        });

        map.addLayer({
          id: "route-line-glow",
          type: "line",
          source: "route-line",
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          paint: {
            "line-color": "#ffffff",
            "line-width": 10,
            "line-opacity": 0.36
          }
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route-line",
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          paint: {
            "line-color": "#111111",
            "line-width": 5,
            "line-opacity": 0.88
          }
        });
      });

      map.on("click", (event) => {
        const nearest = findNearestLocation(locations, event.lngLat.lng, event.lngLat.lat);
        onMapPick(nearest.id);
      });

      mapRef.current = map;
    }

    initializeMap();

    return () => {
      removed = true;
      loadedRef.current = false;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [interactiveReady, locations, mapToken, onMapPick]);

  useEffect(() => {
    if (!interactiveReady || !mapRef.current || !mapboxRef.current || !loadedRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const mapboxgl = mapboxRef.current;

    for (const location of locations) {
      const element = document.createElement("button");
      const role =
        location.id === startLocation?.id ? "start" : location.id === endLocation?.id ? "end" : "poi";

      element.type = "button";
      element.className = `map-marker ${role}`;
      element.title = `${location.label}${role === "poi" ? "" : ` (${role})`}`;
      element.innerHTML =
        role === "poi"
          ? '<span class="map-marker-core"></span>'
          : `<span class="map-marker-badge">${role === "start" ? "A" : "B"}</span>`;
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onMapPick(location.id);
      });

      const marker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat([location.coordinates.longitude, location.coordinates.latitude])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    }
  }, [endLocation?.id, interactiveReady, locations, onMapPick, startLocation?.id]);

  useEffect(() => {
    if (!interactiveReady || !mapRef.current || !loadedRef.current) {
      return;
    }

    const source = mapRef.current.getSource("route-line");

    if (source) {
      source.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeCoordinates
        }
      });
    }

    const focusPoints = routeCoordinates.length > 1 ? routeCoordinates : selectedPoints;
    const bounds = getBounds(focusPoints);

    if (!bounds) {
      return;
    }

    if (bounds.west === bounds.east && bounds.south === bounds.north) {
      mapRef.current.flyTo({
        center: [bounds.west, bounds.south],
        zoom: 15,
        duration: 700
      });
      return;
    }

    mapRef.current.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north]
      ],
      {
        padding: {
          top: 120,
          right: 40,
          bottom: 180,
          left: 40
        },
        duration: 700,
        maxZoom: 15.2
      }
    );
  }, [interactiveReady, routeCoordinates, selectedPoints]);

  if (!interactiveReady) {
    return (
      <section className="map-surface static" aria-label="Map preview">
        <div className="map-grid" />
        <div className="map-static-card">
          <p>Mapbox token needed for the live map.</p>
          <span>Set `VITE_MAPBOX_ACCESS_TOKEN` to enable click-to-route interactions.</span>
        </div>
        <div className="map-static-pills">
          {locations.map((location) => (
            <button key={location.id} type="button" className="static-location-pill" onClick={() => onMapPick(location.id)}>
              {location.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="map-surface">
      <div ref={containerRef} className="map-canvas" />
      <div className="map-overlay-hint">
        <span className="map-active-dot" />
        <p>{`Tap the map to set ${activeField === "end" ? "destination" : "start"}.`}</p>
      </div>
    </section>
  );
}
