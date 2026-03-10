# CStreetMap

## Overview

`CStreetMap` is an abstract interface representing a street map with nodes and ways. The system consists of **nodes** and **ways**.

- A **node** represents a point on the map with coordinates and optional attributes.
- A **way** represents a sequence of nodes forming a path or road, with optional attributes.

This interface defines the required behavior for any concrete street map implementation.

---

## Type Definitions

### `TNodeID`

```cpp
using TNodeID = uint64_t;
```

Represents the type used for node identifiers.

### `TWayID`

```cpp
using TWayID = uint64_t;
```

Represents the type used for way identifiers.

### `TLocation`

```cpp
using TLocation = std::pair<double, double>;
```

Represents a geographic location as a pair of coordinates (latitude, longitude).

### `InvalidNodeID`

```cpp
inline static const TNodeID InvalidNodeID = std::numeric_limits<TNodeID>::max();
```

Returned when a node index is invalid or out of range.

### `InvalidWayID`

```cpp
inline static const TWayID InvalidWayID = std::numeric_limits<TWayID>::max();
```

Returned when a way index is invalid or out of range.

---

## Nested Structures

### `SNode`

Represents a single node (point) on the street map.

```cpp
struct SNode {
    virtual ~SNode(){};
    virtual TNodeID ID() const noexcept = 0;
    virtual TLocation Location() const noexcept = 0;
    virtual std::size_t AttributeCount() const noexcept = 0;
    virtual std::string GetAttributeKey(std::size_t index) const noexcept = 0;
    virtual bool HasAttribute(const std::string &key) const noexcept = 0;
    virtual std::string GetAttribute(const std::string &key) const noexcept = 0;
};
```

#### Member Functions

- **`ID()`** — Returns the node's unique identifier.
- **`Location()`** — Returns the node's geographic location as `TLocation` (latitude, longitude pair).
- **`AttributeCount()`** — Returns the number of attributes associated with this node.
- **`GetAttributeKey(std::size_t index)`** — Returns the key name at the given attribute index.
- **`HasAttribute(const std::string &key)`** — Returns `true` if the node has the specified attribute key.
- **`GetAttribute(const std::string &key)`** — Returns the value of the attribute with the given key, or an empty string if not found.

### `SWay`

Represents a way (path or road) composed of a sequence of nodes.

```cpp
struct SWay {
    virtual ~SWay(){};
    virtual TWayID ID() const noexcept = 0;
    virtual std::size_t NodeCount() const noexcept = 0;
    virtual TNodeID GetNodeID(std::size_t index) const noexcept = 0;
    virtual std::size_t AttributeCount() const noexcept = 0;
    virtual std::string GetAttributeKey(std::size_t index) const noexcept = 0;
    virtual bool HasAttribute(const std::string &key) const noexcept = 0;
    virtual std::string GetAttribute(const std::string &key) const noexcept = 0;
};
```

#### Member Functions

- **`ID()`** — Returns the way's unique identifier.
- **`NodeCount()`** — Returns the number of nodes in this way.
- **`GetNodeID(std::size_t index)`** — Returns the node ID at the given index in the way sequence.
- **`AttributeCount()`** — Returns the number of attributes associated with this way.
- **`GetAttributeKey(std::size_t index)`** — Returns the key name at the given attribute index.
- **`HasAttribute(const std::string &key)`** — Returns `true` if the way has the specified attribute key.
- **`GetAttribute(const std::string &key)`** — Returns the value of the attribute with the given key, or an empty string if not found.

---

## Public Member Functions

### `NodeCount()`

Returns the total number of nodes in the map.

```cpp
virtual std::size_t NodeCount() const noexcept = 0;
```

### `WayCount()`

Returns the total number of ways in the map.

```cpp
virtual std::size_t WayCount() const noexcept = 0;
```

### `NodeByIndex(std::size_t index)`

Returns the node at the given index.

```cpp
virtual std::shared_ptr<SNode> NodeByIndex(std::size_t index) const noexcept = 0;
```

**Returns:**
- `std::shared_ptr<SNode>` if valid
- `nullptr` if `index >= NodeCount()`

### `NodeByID(TNodeID id)`

Returns the node with the specified node ID.

```cpp
virtual std::shared_ptr<SNode> NodeByID(TNodeID id) const noexcept = 0;
```

**Returns:**
- `std::shared_ptr<SNode>` if found
- `nullptr` if no node matches the ID

### `WayByIndex(std::size_t index)`

Returns the way at the given index.

```cpp
virtual std::shared_ptr<SWay> WayByIndex(std::size_t index) const noexcept = 0;
```

**Returns:**
- `std::shared_ptr<SWay>` if valid
- `nullptr` if `index >= WayCount()`

### `WayByID(TWayID id)`

Returns the way with the specified way ID.

```cpp
virtual std::shared_ptr<SWay> WayByID(TWayID id) const noexcept = 0;
```

**Returns:**
- `std::shared_ptr<SWay>` if found
- `nullptr` if no way matches the ID

---

## Example Usage

```cpp
// Get a node by ID
auto node = streetMap->NodeByID(123);
if(node) {
    auto location = node->Location();
    std::cout << "Node at (" << location.first << ", " << location.second << ")" << std::endl;
    
    if(node->HasAttribute("name")) {
        std::cout << "Name: " << node->GetAttribute("name") << std::endl;
    }
}


auto way = streetMap->WayByID(456);
if(way) {
    std::cout << "Way with " << way->NodeCount() << " nodes" << std::endl;
    
    for(std::size_t i = 0; i < way->NodeCount(); i++) {
        auto nodeID = way->GetNodeID(i);
        auto wayNode = streetMap->NodeByID(nodeID);
        if(wayNode) {
            auto location = wayNode->Location();
            std::cout << "  Node " << i << ": (" << location.first << ", " << location.second << ")" << std::endl;
        }
    }
}
```

---

## Design Notes

- All member functions are `noexcept`.
- Index-based access must be bounds-checked.
- ID-based access must safely return `nullptr` when not found.
- Attributes provide flexible key-value storage for nodes and ways.
- This class is purely an interface and contains no implementation logic.