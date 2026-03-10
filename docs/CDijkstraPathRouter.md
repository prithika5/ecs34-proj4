# CDijkstraPathRouter

## Overview

`CDijkstraPathRouter` is a concrete implementation of the `CPathRouter` interface. It stores vertices and weighted edges, then finds shortest paths using Dijkstra's Algorithm.

This class is used as the main shortest path engine for the transportation planner logic.

---

## Type Definitions

### `SImplementation`

```cpp
struct SImplementation;
```

An opaque implementation structure that stores the graph data and routing logic.

---

## Private Members

### `DImplementation`

```cpp
std::unique_ptr<SImplementation> DImplementation;
```

A unique pointer that owns the internal implementation.

---

## Constructors

### `CDijkstraPathRouter()`

Constructs an empty path router.

```cpp
CDijkstraPathRouter();
```

---

## Destructors

### `~CDijkstraPathRouter()`

```cpp
~CDijkstraPathRouter();
```

Destroys the router and releases the implementation.

---

## Public Member Functions

### `VertexCount()`

Returns the number of vertices.

```cpp
std::size_t VertexCount() const noexcept;
```

### `AddVertex(std::any tag)`

Adds a vertex and stores the provided tag.

```cpp
TVertexID AddVertex(std::any tag) noexcept;
```

### `GetVertexTag(TVertexID id)`

Returns the tag for a vertex.

```cpp
std::any GetVertexTag(TVertexID id) const noexcept;
```

### `AddEdge(TVertexID src, TVertexID dest, double weight, bool bidir = false)`

Adds a weighted edge.

```cpp
bool AddEdge(TVertexID src, TVertexID dest, double weight, bool bidir = false) noexcept;
```

**Behavior:**
- Rejects invalid vertex IDs
- Rejects negative weights
- Adds the reverse edge if `bidir` is true

### `Precompute(std::chrono::steady_clock::time_point deadline)`

Allows optional precomputation.

```cpp
bool Precompute(std::chrono::steady_clock::time_point deadline) noexcept;
```

Current implementation returns `true` without extra work.

### `FindShortestPath(TVertexID src, TVertexID dest, std::vector<TVertexID> &path)`

Runs Dijkstra's Algorithm to find the shortest route.

```cpp
double FindShortestPath(TVertexID src, TVertexID dest, std::vector<TVertexID> &path) noexcept;
```

**Returns:**
- The total path weight
- `NoPathExists` if no valid path exists

---

## Example Usage

```cpp
CDijkstraPathRouter router;

auto a = router.AddVertex(std::string("A"));
auto b = router.AddVertex(std::string("B"));
auto c = router.AddVertex(std::string("C"));

router.AddEdge(a, b, 4.0);
router.AddEdge(b, c, 3.0);

std::vector<CPathRouter::TVertexID> path;
double dist = router.FindShortestPath(a, c, path);
```

---

## Design Notes

- Uses an adjacency list representation
- Stores vertex tags separately from graph edge weights
- Uses Dijkstra's Algorithm, so weights must be non-negative
