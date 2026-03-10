# CDijkstraTransportationPlanner

## Overview

`CDijkstraTransportationPlanner` is a concrete implementation of `CTransportationPlanner`. It builds road, bike, walk, and bus graphs from the street map and bus system, then answers shortest and fastest path queries.

It also supports generating printable path descriptions from fastest-path trip steps.

---

## Type Definitions

### `SImplementation`

```cpp
struct SImplementation;
```

Opaque implementation structure that stores map data, graph data, and helper functions.

---

## Private Members

### `DImplementation`

```cpp
std::unique_ptr<SImplementation> DImplementation;
```

Stores the internal implementation and graph data.

---

## Constructors

### `CDijkstraTransportationPlanner(std::shared_ptr<SConfiguration> config)`

Constructs the planner from a configuration object.

```cpp
CDijkstraTransportationPlanner(std::shared_ptr<SConfiguration> config);
```

**Parameters:**
- `config` — Supplies the street map, bus system, and routing assumptions

**Behavior:**
- Loads and sorts all nodes
- Builds road edges for shortest paths
- Builds walk and bike edges for fastest paths
- Builds bus stop-to-stop edges using the street map

---

## Destructors

### `~CDijkstraTransportationPlanner()`

```cpp
~CDijkstraTransportationPlanner();
```

Releases the internal implementation.

---

## Public Member Functions

### `NodeCount()`

Returns the number of street map nodes.

```cpp
std::size_t NodeCount() const noexcept override;
```

### `SortedNodeByIndex(std::size_t index)`

Returns a node sorted by node ID.

```cpp
std::shared_ptr<CStreetMap::SNode> SortedNodeByIndex(std::size_t index) const noexcept override;
```

### `FindShortestPath(TNodeID src, TNodeID dest, std::vector<TNodeID> &path)`

Finds the shortest path using road distance.

```cpp
double FindShortestPath(TNodeID src, TNodeID dest, std::vector<TNodeID> &path) override;
```

### `FindFastestPath(TNodeID src, TNodeID dest, std::vector<TTripStep> &path)`

Finds the fastest path by comparing walking/biking and walking/bus options.

```cpp
double FindFastestPath(TNodeID src, TNodeID dest, std::vector<TTripStep> &path) override;
```

### `GetPathDescription(const std::vector<TTripStep> &path, std::vector<std::string> &desc) const`

Builds printable directions from trip steps.

```cpp
bool GetPathDescription(const std::vector<TTripStep> &path, std::vector<std::string> &desc) const override;
```

---

## Example Usage

```cpp
auto config = std::make_shared<STransportationPlannerConfig>(streetMap, busSystem);
CDijkstraTransportationPlanner planner(config);

std::vector<CTransportationPlanner::TNodeID> shortpath;
planner.FindShortestPath(1, 4, shortpath);

std::vector<CTransportationPlanner::TTripStep> fastpath;
planner.FindFastestPath(1, 4, fastpath);
```

---

## Design Notes

- Uses Dijkstra-style shortest path logic internally
- Keeps separate edge sets for shortest, walking, biking, and bus travel
- Stores way names and stop mappings so `GetPathDescription()` can print useful instructions
