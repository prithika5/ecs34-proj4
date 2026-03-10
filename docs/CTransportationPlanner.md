# CTransportationPlanner

## Overview

`CTransportationPlanner` is an abstract interface for transportation planning over a street map and bus system. It supports shortest path queries, fastest path queries, and conversion of trip steps into human-readable directions.

Concrete implementations, such as `CDijkstraTransportationPlanner`, provide the actual routing logic.

---

## Type Definitions

### `TNodeID`

```cpp
using TNodeID = CStreetMap::TNodeID;
```

Represents a street map node ID.

### `ETransportationMode`

```cpp
enum class ETransportationMode {Walk, Bike, Bus};
```

Represents the mode used for a trip step.

### `TTripStep`

```cpp
using TTripStep = std::pair<ETransportationMode, TNodeID>;
```

Represents one step in a fastest path.

### `SConfiguration`

```cpp
struct SConfiguration;
```

Configuration interface used to provide the street map, bus system, and speed assumptions.

---

## Public Member Functions

### `NodeCount()`

Returns the number of nodes in the street map.

```cpp
virtual std::size_t NodeCount() const noexcept = 0;
```

### `SortedNodeByIndex(std::size_t index)`

Returns a street map node sorted by node ID.

```cpp
virtual std::shared_ptr<CStreetMap::SNode> SortedNodeByIndex(std::size_t index) const noexcept = 0;
```

### `FindShortestPath(TNodeID src, TNodeID dest, std::vector<TNodeID> &path)`

Finds the shortest path by distance.

```cpp
virtual double FindShortestPath(TNodeID src, TNodeID dest, std::vector<TNodeID> &path) = 0;
```

### `FindFastestPath(TNodeID src, TNodeID dest, std::vector<TTripStep> &path)`

Finds the fastest path by time.

```cpp
virtual double FindFastestPath(TNodeID src, TNodeID dest, std::vector<TTripStep> &path) = 0;
```

### `GetPathDescription(const std::vector<TTripStep> &path, std::vector<std::string> &desc) const`

Converts trip steps into human-readable instructions.

```cpp
virtual bool GetPathDescription(const std::vector<TTripStep> &path, std::vector<std::string> &desc) const = 0;
```

---

## Example Usage

```cpp
std::shared_ptr<CTransportationPlanner> planner;

std::vector<CTransportationPlanner::TNodeID> shortpath;
double dist = planner->FindShortestPath(1, 4, shortpath);

std::vector<CTransportationPlanner::TTripStep> fastpath;
double time = planner->FindFastestPath(1, 4, fastpath);
```

---

## Design Notes

- Combines road network and bus network planning
- Separates shortest-distance routing from fastest-time routing
- Allows different planner implementations to share one interface
