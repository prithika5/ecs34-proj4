# Project 3 README

## Team Members
- **Student 1:** Prithika Thilakarajan (923266507)
- **Student 2:** Qi Gao (921902627)

## Project Status

All required classes were successfully implemented, including `CCSVBusSystem` and `COpenStreetMap`. The supporting inner structs `SStop`, `SRoute`, `SNode`, and `SWay` were also fully implemented according to the abstract interface specifications.

All GoogleTest test suites compile and pass.

The Makefile builds all required test executables, uses the C++17 standard, and automatically creates the `obj` and `bin` directories if they do not already exist. It runs the test executables in the required order and supports the `make clean` target to remove generated build files.

Code coverage was verified using `lcov` to ensure sufficient test coverage of the implementation.

## Known Issues

There are no known functional issues. All required features were implemented and tested successfully.

## References

- OpenStreetMap XML Format: https://wiki.openstreetmap.org/wiki/OSM_XML
- C++ Reference: https://www.cplusplus.com/reference/
- CPlusPlus Documentation: https://en.cppreference.com/
- Expat XML Parser: https://libexpat.github.io/
- Git Documentation: https://git-scm.com/docs
- GNU Make Manual: https://www.gnu.org/software/make/manual/make.html

## Generative AI Use

The following prompts and responses were used to guide implementation:

### Student 1 (Prithika) – OpenStreetMap Implementation Prompts

#### Prompt 1: Structuring Nodes And Ways

**Question:**
How should I store nodes and ways so I can access them both by index and by ID?

**Response:**
Use both a std::vector and a std::unordered_map.
The vector preserves insertion order for index-based access.
The unordered_map allows fast lookup by ID.

**Implementation:**

Nodes:
```cpp
std::vector<std::shared_ptr<SNode>> DNodesByIndex;
std::unordered_map<TNodeID,std::shared_ptr<SNode>> DNodesByID;
```

Ways:
```cpp
std::vector<std::shared_ptr<SWay>> DWaysByIndex;
std::unordered_map<TWayID,std::shared_ptr<SWay>> DWaysByID;
```

Both containers are populated inside ParseNodes() and ParseWays().

#### Prompt 2: Parsing Nodes Safely

**Question:**
How do I parse <node> elements and skip invalid ones?

**Response:**
When encountering a node element:
- Extract id, lat, and lon.
- If any required attribute is missing, skip the node.
- If it is a self-closing element, store it immediately.
- Otherwise, continue reading until </node> and collect <tag> children.

**Implementation:**

In ParseNodes():
```cpp
if(idStr.empty()) continue;
if(latStr.empty()) continue;
if(lonStr.empty()) continue;
```

Tag handling:
```cpp
if(node->Attrs.find(k) == node->Attrs.end())
    node->Keys.push_back(k);
node->Attrs[k] = v;
```

#### Prompt 3: Parsing Ways And Validating Node References

**Question:**
How do I parse <way> elements and ignore references to nodes that don't exist?

**Response:**
- Skip the way if it has no id.
- If self-closing, store with zero nodes.
- Otherwise, read children until </way>.
- For each <nd ref="..."/>, only add the reference if the node exists in DNodesByID.

**Implementation:**

Reference validation:
```cpp
if(DNodesByID.find(ref) != DNodesByID.end())
    way->Nodes.push_back(ref);
```

Missing ID skip:
```cpp
if(idStr.empty()) return;
```

#### Prompt 4: Validating Root Element

**Question:**
How do I ensure parsing only happens if the root element is <osm>?

**Response:**
Read entities until the first start or complete element.
If its name is not "osm", return false.

**Implementation:**

In ParseOpenStreetMap():
```cpp
if(e.DNameData != DOSMTag){
    return false;
}
```

#### Prompt 5: Cover Missing Node Attributes

**Question:**
My coverage report says the continue; lines in ParseNodes() for missing id and missing lat aren't covered. What OSM test input should I write to hit those branches?

**Response:**
Make a test XML with:
- a node missing id but having lat and lon → triggers if(idStr.empty()) continue;
- a node missing lat but having id and lon → triggers if(latStr.empty()) continue;
- one valid node → ensures parsing still adds something

Then assert NodeCount() is 1 and the remaining node can be looked up by ID.

**Implementation:**

Created TEST(OSMTest, SkipMissingIdAndLat) with three nodes:
```xml
<node lat="38.5" lon="-121.7"/> (missing id)
<node id="2" lon="-121.8"/> (missing lat)
<node id="3" lat="38.7" lon="-121.9"/> (valid)
```

#### Prompt 6: Silencing Warnings And Hiding Coverage Spam

**Question:**
My builds print a lot of warnings and the lcov/genhtml coverage commands spam the terminal. What Makefile flags/commands can I use to hide that output but still generate coverage?

**Response:**
- To suppress the PSABI warning from GCC, add -Wno-psabi to your C++ compile flags (your CPPFLAGS is a good place).
- To hide coverage tool output, redirect stdout/stderr to /dev/null, and set LC_ALL=C so locale warnings don't appear.
- Keep a final lcov --summary line so you still get a clean coverage summary.

**Implementation:**

PSABI warning suppression was added via:
```makefile
CPPFLAGS += -std=c++17 -Wno-psabi
```

Coverage spam was hidden by redirecting output and forcing locale to C:
```makefile
gencoverage:
	@LC_ALL=C lcov --capture --directory . --no-external --output-file $(TESTCOVER_DIR)/coverage.info > /dev/null 2>&1
	@LC_ALL=C lcov --remove $(TESTCOVER_DIR)/coverage.info '/usr/*' '*/testsrc/*' --output-file $(TESTCOVER_DIR)/coverage.info > /dev/null 2>&1
	@LC_ALL=C genhtml $(TESTCOVER_DIR)/coverage.info --output-directory $(TESTCOVER_DIR) > /dev/null 2>&1
	@echo ""
	@echo "Coverage Summary:"
	@LC_ALL=C lcov --summary $(TESTCOVER_DIR)/coverage.info
```

### Student 2 (Qi Gao) – BusSystemIndexer and DijkstraPathRouter Implementation Prompts

#### Prompt 1: Sorting Stops And Routes For Indexed Access

**Question:**
How do I support `SortedStopByIndex()` and `SortedRouteByIndex()` efficiently?

**Response:**
- Copy all stops into a vector and sort them by stop ID.
- Copy all routes into a vector and sort them by route name.
- This makes indexed access easy after construction.

If the index is invalid:
- Return `nullptr`
- Do not access the vector directly

**Implementation:**

```cpp
for(size_t Index = 0; Index < DBusSystem->StopCount(); Index++){
    auto Stop = DBusSystem->StopByIndex(Index);
    DSortedStopsByIndex.push_back(Stop);
}

std::sort(DSortedStopsByIndex.begin(), DSortedStopsByIndex.end(),
          [](std::shared_ptr<SStop> l, std::shared_ptr<SStop> r) -> bool{
              return l->ID() < r->ID();
          });

for(size_t Index = 0; Index < DBusSystem->RouteCount(); Index++){
    auto Route = DBusSystem->RouteByIndex(Index);
    DSortedRoutesByIndex.push_back(Route);
}

std::sort(DSortedRoutesByIndex.begin(), DSortedRoutesByIndex.end(),
          [](std::shared_ptr<SRoute> l, std::shared_ptr<SRoute> r) -> bool{
              return l->Name() < r->Name();
          });
```

#### Prompt 2: Looking Up Stops By Node ID

**Question:**
How do I implement `StopByNodeID()` efficiently?

**Response:**
- Use an `unordered_map<TNodeID, shared_ptr<SStop>>`.
- The key is the node ID.
- The value is the stop pointer.

During construction:
- Insert every stop into `DStopsByNodeID`
- Then `StopByNodeID()` can use `.find()` directly

If the node ID does not exist:
- Return `nullptr`

**Implementation:**

```cpp
for(size_t Index = 0; Index < DBusSystem->StopCount(); Index++){
    auto Stop = DBusSystem->StopByIndex(Index);
    DStopsByNodeID[Stop->NodeID()] = Stop;
}
```

```cpp
auto Search = DStopsByNodeID.find(id);
if(Search == DStopsByNodeID.end()){
    return nullptr;
}
return Search->second;
```

#### Prompt 3: Detecting Routes Between Two Node IDs

**Question:**
How do I check whether there is a route segment between two node IDs?

**Response:**
- Walk through every route.
- For each consecutive pair of stops, convert the stop IDs into node IDs.
- Store the route using the pair `(srcNodeID, destNodeID)` as the key.

This allows:
- `RoutesByNodeIDs()` to return the matching route set
- `RouteBetweenNodeIDs()` to quickly check if at least one route exists

**Implementation:**

```cpp
for(auto Route: DSortedRoutesByIndex){
    for(size_t Index = 1; Index < Route->StopCount(); Index++){
        auto Previous = Route->GetStopID(Index-1);
        auto Current = Route->GetStopID(Index);
        auto FirstNodeID = DBusSystem->StopByID(Previous)->NodeID();
        auto SecondNodeID = DBusSystem->StopByID(Current)->NodeID();
        auto Key = std::make_pair(FirstNodeID,SecondNodeID);

        auto Search = DRoutesByNodeIDs.find(Key);
        if(Search == DRoutesByNodeIDs.end()){
            DRoutesByNodeIDs[Key] = {Route};
        }
        else{
            Search->second.insert(Route);
        }
    }
}
```

#### Prompt 4: Handling Invalid Indexes Safely

**Question:**
What should happen if `SortedStopByIndex()` or `SortedRouteByIndex()` gets an invalid index?

**Response:**
- Check the index before using it.
- If the index is out of range, return `nullptr`.
- This avoids invalid vector access and prevents crashes.

**Implementation:**

```cpp
if(index >= DSortedStopsByIndex.size()){
    return nullptr;
}
return DSortedStopsByIndex[index];
```

```cpp
if(index >= DSortedRoutesByIndex.size()){
    return nullptr;
}
return DSortedRoutesByIndex[index];
```

#### Prompt 5: Representing The Graph In DijkstraPathRouter

**Question:**
How do I store the graph for Dijkstra's algorithm?

**Response:**
- Store all vertices in a vector.
- Each vertex stores a tag and a list of outgoing edges.
- Each edge stores the weight and the destination vertex ID.

This makes path search easier because:
- neighbors are easy to iterate through
- the destination ID is already available

**Implementation:**

```cpp
struct SVertex;
using TEdge = std::pair<double,TVertexID>;

struct SVertex{
    std::vector<TEdge> DEdges;
    std::any DTag;
};

std::vector<std::shared_ptr<SVertex>> DVertices;
```

#### Prompt 6: Validating Edges Before Adding Them

**Question:**
What checks should `AddEdge()` perform?

**Response:**
- Verify that `src` is a valid vertex ID.
- Verify that `dest` is a valid vertex ID.
- Reject the edge if the weight is negative.

If `bidir` is true:
- Add the reverse edge too

If any input is invalid:
- Return `false`

**Implementation:**

```cpp
if(src >= DVertices.size() || dest >= DVertices.size() || weight < 0){
    return false;
}

DVertices[src]->DEdges.push_back(std::make_pair(weight,dest));

if(bidir){
    DVertices[dest]->DEdges.push_back(std::make_pair(weight,src));
}

return true;
```
#### Prompt 7: Implementing Dijkstra's Algorithm

**Question:**
How did I implement `FindShortestPath()`?

**Response:**
- Use three vectors:
  - `w` for shortest known distances
  - `p` for previous vertex
  - `v` for visited flags
- Initialize every distance to infinity.
- Set the source distance to `0`.
- Repeatedly choose the unvisited vertex with the smallest distance.
- Relax all outgoing edges from that vertex.

Stop when:
- there are no more reachable vertices
- or the destination has been reached

**Implementation:**

```cpp
std::vector<double> w;
w.resize(DVertices.size(),std::numeric_limits<double>::max());

std::vector<TVertexID> p;
p.resize(DVertices.size(),std::numeric_limits<TVertexID>::max());

std::vector<bool> v;
v.resize(DVertices.size(),false);

w[src] = 0;

for(std::size_t i = 0; i < DVertices.size(); i++){
    TVertexID c = std::numeric_limits<TVertexID>::max();
    double m = std::numeric_limits<double>::max();

    for(TVertexID j = 0; j < DVertices.size(); j++){
        if(!v[j] && w[j] < m){
            m = w[j];
            c = j;
        }
    }

    if(c == std::numeric_limits<TVertexID>::max()){
        break;
    }

    v[c] = true;

    if(c == dest){
        break;
    }

    for(std::size_t j = 0; j < DVertices[c]->DEdges.size(); j++){
        double ew = DVertices[c]->DEdges[j].first;
        TVertexID n = DVertices[c]->DEdges[j].second;

        if(!v[n] && w[c] != std::numeric_limits<double>::max() && w[c] + ew < w[n]){
            w[n] = w[c] + ew;
            p[n] = c;
        }
    }
}
```

#### Prompt 8: Reconstructing The Final Path

**Question:**
After Dijkstra finishes, how do I build the final path?

**Response:**
- First check whether the destination is reachable.
- If not reachable, return `NoPathExists`.
- Otherwise, start from `dest` and move backward using the previous array.
- Store the vertices in reverse order first.
- Then push them into `path` in forward order.

If backward tracing fails:
- Clear `path`
- Return `NoPathExists`

**Implementation:**

```cpp
if(w[dest] == std::numeric_limits<double>::max()){
    return NoPathExists;
}

std::vector<TVertexID> r;
TVertexID c = dest;

while(c != src){
    r.push_back(c);
    c = p[c];

    if(c == std::numeric_limits<TVertexID>::max()){
        path.clear();
        return NoPathExists;
    }
}

r.push_back(src);

for(std::size_t i = r.size(); i > 0; i--){
    path.push_back(r[i-1]);
}

return w[dest];
```

#### Prompt 9: Testing Invalid Edge Input

**Question:**
How do I test that `AddEdge()` rejects invalid vertex IDs?

**Response:**
- Create valid vertices first.
- Then try adding edges using invalid vertex IDs.
- `AddEdge()` should return `false`.

This verifies:
- bounds checking works
- invalid edges are not inserted

**Implementation:**

```cpp
auto VertexA = PathRouter.AddVertex(std::string("A"));
auto VertexB = PathRouter.AddVertex(std::string("B"));

EXPECT_FALSE(PathRouter.AddEdge(VertexA, 10, 1.0));
EXPECT_FALSE(PathRouter.AddEdge(10, VertexB, 1.0));
```

#### Prompt 10: Testing Negative Edge Weights

**Question:**
How do I test that `AddEdge()` rejects negative weights?

**Response:**
- Create two valid vertices.
- Try adding an edge with a negative weight.
- `AddEdge()` should return `false`.

This verifies:
- negative weights are rejected
- the implementation matches Dijkstra's assumptions

**Implementation:**

```cpp
auto VertexA = PathRouter.AddVertex(std::string("A"));
auto VertexB = PathRouter.AddVertex(std::string("B"));

EXPECT_FALSE(PathRouter.AddEdge(VertexA, VertexB, -1.0));
```

#### Prompt 11: Testing Bidirectional Edges

**Question:**
How do I test that `bidir = true` really adds both directions?

**Response:**
- Add one bidirectional edge from A to B.
- Then search for a path from B back to A.
- The path should exist and the distance should match the edge weight.

This verifies:
- reverse edge insertion works
- bidirectional routing behaves correctly

**Implementation:**

```cpp
EXPECT_TRUE(PathRouter.AddEdge(VertexA, VertexB, 3.0, true));

std::vector<CPathRouter::TVertexID> Path;
EXPECT_EQ(PathRouter.FindShortestPath(VertexB, VertexA, Path), 3.0);

std::vector<CPathRouter::TVertexID> ExpectedPath{VertexB, VertexA};
EXPECT_EQ(Path, ExpectedPath);
```

#### Prompt 12: Testing The No-Path Case

**Question:**
How do I test that `FindShortestPath()` correctly reports no path exists?

**Response:**
- Create a graph where one vertex is disconnected.
- Try finding a path to the disconnected vertex.
- The function should return `NoPathExists`.
- The returned path should be empty.

This verifies:
- unreachable destinations are handled correctly
- old path contents are not left behind

**Implementation:**

```cpp
auto VertexA = PathRouter.AddVertex(std::string("A"));
auto VertexB = PathRouter.AddVertex(std::string("B"));
auto VertexC = PathRouter.AddVertex(std::string("C"));

EXPECT_TRUE(PathRouter.AddEdge(VertexA, VertexB, 2.0));

std::vector<CPathRouter::TVertexID> Path;
EXPECT_EQ(PathRouter.FindShortestPath(VertexA, VertexC, Path), CDijkstraPathRouter::NoPathExists);
EXPECT_TRUE(Path.empty());
```
