# COpenStreetMap

## Overview

`COpenStreetMap` is a concrete implementation of the `CStreetMap` abstract interface. It loads nodes and ways from XML files using `CXMLReader`.

This class provides a practical way to construct a street map from OpenStreetMap XML data sources, implementing all virtual methods from `CStreetMap`.

---

## Type Definitions

### `SImplementation`

```cpp
struct SImplementation;
```

An opaque implementation structure that holds the internal state of the street map. This uses the **Pimpl (Pointer to Implementation)** design pattern to hide implementation details and reduce header file dependencies.

---

## Private Members

### `DImplementation`

```cpp
std::unique_ptr<SImplementation> DImplementation;
```

A unique pointer managing the implementation structure. Automatically cleaned up when the `COpenStreetMap` is destroyed.

---

## Constructors

### `COpenStreetMap(std::shared_ptr<CXMLReader> src)`

Constructs a `COpenStreetMap` from an XML data source.

```cpp
COpenStreetMap(std::shared_ptr<CXMLReader> src);
```

**Parameters:**
- `src` — A `CXMLReader` providing OpenStreetMap XML data

**Behavior:**
- Reads all nodes from the XML source
- Reads all ways from the XML source
- Populates internal data structures for fast lookups by index and ID
- Parses node attributes and way node references

---

## Destructors

### `~COpenStreetMap()`

```cpp
~COpenStreetMap();
```

Virtual destructor that properly cleans up the `SImplementation` via the unique pointer.

---

## Public Member Functions

All methods override corresponding pure virtual methods from `CStreetMap` and are marked `noexcept override`.

### `NodeCount()`

Returns the total number of nodes in the map.

```cpp
virtual std::size_t NodeCount() const noexcept override;
```

### `WayCount()`

Returns the total number of ways in the map.

```cpp
virtual std::size_t WayCount() const noexcept override;
```

### `NodeByIndex(std::size_t index)`

Returns the node at the given index.

```cpp
virtual std::shared_ptr<CStreetMap::SNode> NodeByIndex(std::size_t index) const noexcept override;
```

**Returns:**
- `std::shared_ptr<CStreetMap::SNode>` if valid
- `nullptr` if `index >= NodeCount()`

### `NodeByID(TNodeID id)`

Returns the node with the specified node ID.

```cpp
virtual std::shared_ptr<CStreetMap::SNode> NodeByID(TNodeID id) const noexcept override;
```

**Returns:**
- `std::shared_ptr<CStreetMap::SNode>` if found
- `nullptr` if no node matches the ID

### `WayByIndex(std::size_t index)`

Returns the way at the given index.

```cpp
virtual std::shared_ptr<CStreetMap::SWay> WayByIndex(std::size_t index) const noexcept override;
```

**Returns:**
- `std::shared_ptr<CStreetMap::SWay>` if valid
- `nullptr` if `index >= WayCount()`

### `WayByID(TWayID id)`

Returns the way with the specified way ID.

```cpp
virtual std::shared_ptr<CStreetMap::SWay> WayByID(TWayID id) const noexcept override;
```

**Returns:**
- `std::shared_ptr<CStreetMap::SWay>` if found
- `nullptr` if no way matches the ID

---

## Example Usage

```cpp
// Create a reader for OpenStreetMap XML data
auto xmlReader = std::make_shared<CXMLReader>("map.osm");

// Construct the street map
COpenStreetMap streetMap(xmlReader);

// Query a node by ID
auto node = streetMap.NodeByID(123456);
if(node) {
    auto location = node->Location();
    std::cout << "Node at (" << location.first << ", " << location.second << ")" << std::endl;
}

// Iterate through all ways
for(std::size_t i = 0; i < streetMap.WayCount(); i++) {
    auto way = streetMap.WayByIndex(i);
    if(way) {
        std::cout << "Way with " << way->NodeCount() << " nodes" << std::endl;
        
        if(way->HasAttribute("name")) {
            std::cout << "  Name: " << way->GetAttribute("name") << std::endl;
        }
    }
}

// Traverse a way's nodes
auto way = streetMap.WayByID(789012);
if(way) {
    for(std::size_t i = 0; i < way->NodeCount(); i++) {
        auto nodeID = way->GetNodeID(i);
        auto wayNode = streetMap.NodeByID(nodeID);
        if(wayNode) {
            auto location = wayNode->Location();
            std::cout << "  Node " << i << ": (" << location.first << ", " << location.second << ")" << std::endl;
        }
    }
}
```

---

## Design Notes

- Uses the **Pimpl pattern** to hide implementation details
- All member functions are `noexcept`
- Index-based access must be bounds-checked
- ID-based access must safely return `nullptr` when not found
- XML data is fully loaded into memory at construction time
- Supports all OpenStreetMap node and way attributes