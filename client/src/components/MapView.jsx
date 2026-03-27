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

function createMarkerIcon(role) {
  const html =
    role === "poi"
      ? '<button type="button" class="map-marker poi"><span class="map-marker-core"></span></button>'
      : `<button type="button" class="map-marker ${role}"><span class="map-marker-badge">${role === "start" ? "A" : "B"}</span></button>`;

  return {
    html,
    className: "leaflet-marker-shell",
    iconSize: role === "poi" ? [20, 20] : [34, 34],
    iconAnchor: role === "poi" ? [10, 10] : [17, 17]
  };
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
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const routeLineRef = useRef(null);
  const glowLineRef = useRef(null);
  const interactiveReady = import.meta.env.MODE !== "test";

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
      const leafletModule = await import("leaflet");

      if (removed || !containerRef.current) {
        return;
      }

      const L = leafletModule.default;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true
      }).setView([fallbackCenter.latitude, fallbackCenter.longitude], 14);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      glowLineRef.current = L.polyline([], {
        color: "#ffffff",
        weight: 10,
        opacity: 0.4,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      routeLineRef.current = L.polyline([], {
        color: "#111111",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      map.on("click", (event) => {
        const nearest = findNearestLocation(locations, event.latlng.lng, event.latlng.lat);
        onMapPick(nearest.id);
      });

      mapRef.current = map;
    }

    initializeMap();

    return () => {
      removed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }

      if (glowLineRef.current) {
        glowLineRef.current.remove();
        glowLineRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [interactiveReady, locations, onMapPick]);

  useEffect(() => {
    if (!interactiveReady || !mapRef.current || !leafletRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const L = leafletRef.current;

    for (const location of locations) {
      const role = location.id === startLocation?.id ? "start" : location.id === endLocation?.id ? "end" : "poi";

      const marker = L.marker([location.coordinates.latitude, location.coordinates.longitude], {
        icon: L.divIcon(createMarkerIcon(role))
      })
        .addTo(mapRef.current)
        .on("click", () => onMapPick(location.id));

      markersRef.current.push(marker);
    }
  }, [endLocation?.id, interactiveReady, locations, onMapPick, startLocation?.id]);

  useEffect(() => {
    if (!interactiveReady || !mapRef.current || !routeLineRef.current || !glowLineRef.current) {
      return;
    }

    const latLngs = routeCoordinates.map(([longitude, latitude]) => [latitude, longitude]);

    routeLineRef.current.setLatLngs(latLngs);
    glowLineRef.current.setLatLngs(latLngs);

    const focusPoints = routeCoordinates.length > 1 ? routeCoordinates : selectedPoints;
    const bounds = getBounds(focusPoints);

    if (!bounds) {
      return;
    }

    if (bounds.west === bounds.east && bounds.south === bounds.north) {
      mapRef.current.flyTo([bounds.south, bounds.west], 15, {
        animate: true,
        duration: 0.7
      });
      return;
    }

    mapRef.current.fitBounds(
      [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ],
      {
        paddingTopLeft: [40, 120],
        paddingBottomRight: [40, 180],
        maxZoom: 15
      }
    );
  }, [interactiveReady, routeCoordinates, selectedPoints]);

  if (!interactiveReady) {
    return (
      <section className="map-surface static" aria-label="Map preview">
        <div className="map-grid" />
        <div className="map-static-card">
          <p>OpenStreetMap preview</p>
          <span>The live map loads automatically outside tests, with no token or billing setup.</span>
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
