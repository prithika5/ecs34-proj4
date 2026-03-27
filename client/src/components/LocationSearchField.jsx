import { useEffect, useMemo, useState } from "react";

export default function LocationSearchField({ label, value, locations, onSelect }) {
  const [query, setQuery] = useState(value?.label || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value?.label || "");
  }, [value?.id, value?.label]);

  const filteredLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return locations;
    }

    return locations.filter((location) => {
      const haystack = `${location.label} ${location.area}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [locations, query]);

  function commitSelection(nextLocation) {
    if (!nextLocation) {
      setQuery(value?.label || "");
      setOpen(false);
      return;
    }

    onSelect(nextLocation.id);
    setQuery(nextLocation.label);
    setOpen(false);
  }

  function syncQueryToSelection() {
    const normalizedQuery = query.trim().toLowerCase();
    const currentLabel = value?.label?.trim().toLowerCase() || "";

    if (!normalizedQuery || normalizedQuery === currentLabel) {
      setQuery(value?.label || "");
      setOpen(false);
      return;
    }

    const exactMatch = filteredLocations.find((location) => location.label.trim().toLowerCase() === normalizedQuery);
    commitSelection(exactMatch || filteredLocations[0] || null);
  }

  return (
    <label className="location-search-field active">
      <span>{label}</span>
      <div className="location-search-shell">
        <input
          aria-label={label}
          autoComplete="off"
          placeholder={`Search ${label.toLowerCase()}`}
          value={query}
          onFocus={() => {
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              syncQueryToSelection();
            }

            if (event.key === "Escape") {
              setQuery(value?.label || "");
              setOpen(false);
            }
          }}
          onBlur={() => {
            globalThis.setTimeout(() => {
              syncQueryToSelection();
            }, 120);
          }}
        />

        {open ? (
          <div className="location-search-menu" role="listbox" aria-label={`${label} suggestions`}>
            {filteredLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                className={`location-search-option ${value?.id === location.id ? "selected" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commitSelection(location)}
              >
                <strong>{location.label}</strong>
                <span>{location.area}</span>
              </button>
            ))}
            {filteredLocations.length === 0 ? <p className="location-search-empty">No Davis match found.</p> : null}
          </div>
        ) : null}
      </div>
    </label>
  );
}
