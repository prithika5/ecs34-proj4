# CPathRouter

## Overview

`CPathRouter` is an abstract interface for a weighted graph path router. It provides the common operations needed to add vertices, add edges, optionally precompute data, and find shortest paths.

This interface is used by `CDijkstraPathRouter` to provide a concrete shortest path implementation.

---

## Type Definitions

### `TVertexID`

```cpp
using TVertexID = std::size_t;
```

Represents the numeric ID of a vertex in the path router.

### `InvalidVertexID`

```cpp
static constexpr TVertexID InvalidVertexID = std::numeric_limits<TVertexID>::max();
```

Represents an invalid vertex ID.

### `NoPathExists`

```cpp
static constexpr double NoPathExists = std::numeric_limits<double>::max();
```

Represents a failure to find a path between two vertices.

---

## Public Member Functions

All methods are pure virtual and must be implemented by derived classes.

### `VertexCount()`

Returns the total number of vertices currently stored.

```cpp
virtual std::size_t VertexCount() const noexcept = 0;
```

### `AddVertex(std::any tag)`

Adds a new vertex and associates arbitrary tag data with it.

```cpp
virtual TVertexID AddVertex(std::any tag) noexcept = 0;
```

**Parameters:**
- `tag` — Any user data to associate with the vertex

**Returns:**
- The new vertex ID

### `GetVertexTag(TVertexID id)`

Returns the tag associated with a vertex.

```cpp
virtual std::any GetVertexTag(TVertexID id) const noexcept = 0;
```

**Returns:**
- The stored tag if `id` is valid
- `std::any()` if `id` is invalid

### `AddEdge(TVertexID src, TVertexID dest, double weight, bool bidir = false)`

Adds a weighted directed edge from `src` to `dest`.

```cpp
virtual bool AddEdge(TVertexID src, TVertexID dest, double weight, bool bidir = false) noexcept = 0;
```

**Parameters:**
- `src` — Source vertex
- `dest` — Destination vertex
- `weight` — Edge cost
- `bidir` — If `true`, also adds the reverse edge

**Returns:**
- `true` if the edge was added
- `false` if the vertices are invalid or the weight is invalid

### `Precompute(std::chrono::steady_clock::time_point deadline)`

Allows the router to do optional precomputation before queries.

```cpp
virtual bool Precompute(std::chrono::steady_clock::time_point deadline) noexcept = 0;
```

### `FindShortestPath(TVertexID src, TVertexID dest, std::vector<TVertexID> &path)`

Finds the shortest path from `src` to `dest`.

```cpp
virtual double FindShortestPath(TVertexID src, TVertexID dest, std::vector<TVertexID> &path) noexcept = 0;
```

**Returns:**
- The path distance if a path exists
- `NoPathExists` if no path exists

---

## Example Usage

```cpp
std::shared_ptr<CPathRouter> router;

auto a = router->AddVertex(std::string("A"));
auto b = router->AddVertex(std::string("B"));

router->AddEdge(a, b, 5.0);

std::vector<CPathRouter::TVertexID> path;
double dist = router->FindShortestPath(a, b, path);
```

---

## Design Notes

- The interface is graph-based and does not depend on street map node IDs
- Tags are stored as `std::any` so callers can attach arbitrary vertex data
- Implementations are responsible for handling invalid input safely
