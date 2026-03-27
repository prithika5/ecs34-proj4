import { useEffect, useMemo, useState } from "react";

export default function LocationSearchField({ label, value, locations, onSelect, onActivate, active }) {
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

  return (
    <label className={`location-search-field ${active ? "active" : ""}`}>
      <span>{label}</span>
      <div className="location-search-shell">
        <input
          aria-label={label}
          autoComplete="off"
          placeholder={`Search ${label.toLowerCase()}`}
          value={query}
          onFocus={() => {
            onActivate();
            setOpen(true);
          }}
          onChange={(event) => {
            onActivate();
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            globalThis.setTimeout(() => {
              setOpen(false);
              setQuery(value?.label || "");
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
                onClick={() => {
                  onSelect(location.id);
                  setQuery(location.label);
                  setOpen(false);
                }}
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
