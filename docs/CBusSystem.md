# CBusSystem

## Overview

`CBusSystem` is an abstract interface representing a bus transportation system. The system consists of **stops** and **routes**.

- A **stop** maps a stop ID to a street-map node ID.
- A **route** represents a named sequence of stop IDs.

This interface defines the required behavior for any concrete bus system implementation (such as `CCSVBusSystem`).

---

## Type Definitions

### `TStopID`

```cpp
using TStopID = uint64_t;
```

Represents the type used for stop identifiers.

### `InvalidStopID`

```cpp
static const TStopID InvalidStopID = std::numeric_limits<TStopID>::max();
```

Returned when a stop index is invalid or out of range.

---

## Nested Structures

### `SStop`

Represents a single stop in the bus system.

```cpp
struct SStop {
    virtual ~SStop(){};
    virtual TStopID ID() const noexcept = 0;
    virtual CStreetMap::TNodeID NodeID() const noexcept = 0;
};
```

#### Member Functions

- **`ID()`** — Returns the stop's unique identifier.
- **`NodeID()`** — Returns the corresponding `CStreetMap::TNodeID`. This connects the bus system to the street map.

### `SRoute`

Represents a bus route.

```cpp
struct SRoute {
    virtual ~SRoute(){};
    virtual std::string Name() const noexcept = 0;
    virtual std::size_t StopCount() const noexcept = 0;
    virtual TStopID GetStopID(std::size_t index) const noexcept = 0;
};
```

#### Member Functions

- **`Name()`** — Returns the name of the route (e.g., `"A"`).
- **`StopCount()`** — Returns the number of stops in the route.
- **`GetStopID(index)`** — Returns the stop ID at the given index. Returns `InvalidStopID` if `index` is out of bounds.

---

## Public Member Functions

### `StopCount()`

Returns the total number of stops in the system.

```cpp
virtual std::size_t StopCount() const noexcept = 0;
```

### `RouteCount()`

Returns the total number of routes in the system.

```cpp
virtual std::size_t RouteCount() const noexcept = 0;
```

### `StopByIndex(std::size_t index)`

Returns the stop at the given index.

```cpp
virtual std::shared_ptr<SStop> StopByIndex(std::size_t index) const noexcept = 0;
```

**Returns:**
- `std::shared_ptr<SStop>` if valid
- `nullptr` if `index >= StopCount()`

### `StopByID(TStopID id)`

Returns the stop with the specified stop ID.

```cpp
virtual std::shared_ptr<SStop> StopByID(TStopID id) const noexcept = 0;
```

**Returns:**
- `std::shared_ptr<SStop>` if found
- `nullptr` if no stop matches the ID

### `RouteByIndex(std::size_t index)`

Returns the route at the given index.

```cpp
virtual std::shared_ptr<SRoute> RouteByIndex(std::size_t index) const noexcept = 0;
```

**Returns:**
- `std::shared_ptr<SRoute>` if valid
- `nullptr` if `index >= RouteCount()`

### `RouteByName(const std::string &name)`

Returns the route with the specified name.

```cpp
virtual std::shared_ptr<SRoute> RouteByName(const std::string &name) const noexcept = 0;
```

**Returns:**
- `std::shared_ptr<SRoute>` if found
- `nullptr` if no route matches the name

---

## Example Usage

```cpp
auto route = bus.RouteByName("A");

if(route) {
    for(std::size_t i = 0; i < route->StopCount(); i++) {
        auto stopID = route->GetStopID(i);

        if(stopID == CBusSystem::InvalidStopID) {
            break;
        }

        auto stop = bus.StopByID(stopID);
        if(stop) {
            auto nodeID = stop->NodeID();
            // Use nodeID with CStreetMap
        }
    }
}
```

---

## Design Notes
- All member functions are `noexcept`.
- Index-based access must be bounds-checked.
- ID-based access must safely return `nullptr` when not found.
- This class is purely an interface and contains no implementation logic.