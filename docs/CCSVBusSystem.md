# CCSVBusSystem

## Overview

`CCSVBusSystem` is a concrete implementation of the `CBusSystem` abstract interface. It loads bus stops and routes from CSV files using `CDSVReader`.

This class provides a practical way to construct a bus system from CSV data sources, implementing all virtual methods from `CBusSystem`.

---

## Type Definitions

### `SImplementation`

```cpp
struct SImplementation;
```

An opaque implementation structure that holds the internal state of the bus system. This uses the **Pimpl (Pointer to Implementation)** design pattern to hide implementation details and reduce header file dependencies.

---

## Private Members

### `DImplementation`

```cpp
std::unique_ptr< SImplementation > DImplementation;
```

A unique pointer managing the implementation structure. Automatically cleaned up when the `CCSVBusSystem` is destroyed.

---

## Constructors

### `CCSVBusSystem(std::shared_ptr< CDSVReader > stopsrc, std::shared_ptr< CDSVReader > routesrc)`

Constructs a `CCSVBusSystem` from two CSV data sources.

```cpp
CCSVBusSystem(std::shared_ptr< CDSVReader > stopsrc, std::shared_ptr< CDSVReader > routesrc);
```

**Parameters:**
- `stopsrc` — A `CDSVReader` providing stop data
- `routesrc` — A `CDSVReader` providing route data

**Behavior:**
- Reads all stops from `stopsrc`
- Reads all routes from `routesrc`
- Populates internal data structures for fast lookups

---

## Destructors

### `~CCSVBusSystem()`

```cpp
~CCSVBusSystem();
```

Virtual destructor that properly cleans up the `SImplementation` via the unique pointer.

---

## Public Member Functions

All methods override corresponding pure virtual methods from `CBusSystem` and are marked `noexcept override`.

### `StopCount()`

Returns the total number of stops in the system.

```cpp
virtual std::size_t StopCount() const noexcept override;
```

### `RouteCount()`

Returns the total number of routes in the system.

```cpp
virtual std::size_t RouteCount() const noexcept override;
```

### `StopByIndex(std::size_t index)`

Returns the stop at the given index.

```cpp
virtual std::shared_ptr<SStop> StopByIndex(std::size_t index) const noexcept override;
```

**Returns:**
- `std::shared_ptr<SStop>` if valid
- `nullptr` if `index >= StopCount()`

### `StopByID(TStopID id)`

Returns the stop with the specified stop ID.

```cpp
virtual std::shared_ptr<SStop> StopByID(TStopID id) const noexcept override;
```

**Returns:**
- `std::shared_ptr<SStop>` if found
- `nullptr` if no stop matches the ID

### `RouteByIndex(std::size_t index)`

Returns the route at the given index.

```cpp
virtual std::shared_ptr<SRoute> RouteByIndex(std::size_t index) const noexcept override;
```

**Returns:**
- `std::shared_ptr<SRoute>` if valid
- `nullptr` if `index >= RouteCount()`

### `RouteByName(const std::string &name)`

Returns the route with the specified name.

```cpp
virtual std::shared_ptr<SRoute> RouteByName(const std::string &name) const noexcept override;
```

**Returns:**
- `std::shared_ptr<SRoute>` if found
- `nullptr` if no route matches the name

---

## Example Usage

```cpp
// Create readers for stops and routes CSV files
auto stopsReader = std::make_shared<CDSVReader>("stops.csv");
auto routesReader = std::make_shared<CDSVReader>("routes.csv");

// Construct the bus system
CCSVBusSystem busSystem(stopsReader, routesReader);

// Query a route by name
auto route = busSystem.RouteByName("A");
if(route) {
    std::cout << "Route: " << route->Name() << std::endl;
    std::cout << "Stops: " << route->StopCount() << std::endl;
}

// Query a stop by ID
auto stop = busSystem.StopByID(42);
if(stop) {
    auto nodeID = stop->NodeID();
    // Use nodeID with CStreetMap
}
```

---

## Design Notes

- Uses the **Pimpl pattern** to hide implementation details
- All member functions are `noexcept`
- Index-based access must be bounds-checked
- ID-based access must safely return `nullptr` when not found
- CSV data is fully loaded into memory at construction time