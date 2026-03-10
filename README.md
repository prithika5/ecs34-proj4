# Project 4 README

## Team Members
- **Student 1:** Prithika Thilakarajan (923266507)
- **Student 2:** Qi Gao (921902627)

## Project Status

All required Project 4 classes and programs were implemented, including `CBusSystemIndexer`, `CDijkstraPathRouter`, `CDijkstraTransportationPlanner`, `CTransportationPlannerCommandLine`, `transplanner`, and `speedtest`.

The transportation planner supports shortest path, fastest path, saving paths, and printing trip descriptions. The `GetPathDescription()` extra credit portion was also implemented.

The Makefile builds the required test executables, creates the needed build directories, runs the main test targets, and builds `transplanner` and `speedtest`.

The dev container was updated so `gtest` and `gmock` are both available for the command-line tests.

## Known Issues

The core planner, command-line, router, and indexer tests pass in the current container setup.
The remaining risk is environment-specific grading behavior on the instructor machines, especially for exact route tie-breaking on real data. The `speedtest` program builds and runs, and the optimized planner implementation performed above both the provided baseline and optimized reference numbers in local verification.

## References

- OpenStreetMap XML Format: https://wiki.openstreetmap.org/wiki/OSM_XML
- OpenStreetMap Map Features: https://wiki.openstreetmap.org/wiki/Map_features
- C++ Reference: https://www.cplusplus.com/reference/
- CPlusPlus Documentation: https://en.cppreference.com/
- Expat XML Parser: https://libexpat.github.io/
- XML Expat Article: https://www.xml.com/pub/1999/09/expat/index.html
- Git Documentation: https://git-scm.com/docs
- GNU Make Manual: https://www.gnu.org/software/make/manual/make.html

## Generative AI Use

The following prompts and responses were used to guide implementation for Student 1's Project 4 work on the transportation planner, command-line interface, documentation, and build setup.

### Student 1 (Prithika) – Transportation Planner Implementation Prompts

#### Prompt 1: Building Separate Graphs For Different Travel Modes

**Question:**
How should I organize the transportation planner so shortest path and fastest path can use different rules without making one giant graph routine?

**Response:**
Use separate adjacency maps for each type of movement:
- one for shortest-distance road edges
- one for walking edges
- one for biking edges
- one for bus edges

Then combine the walking graph with either bike edges or bus edges depending on which fastest-path case you want to test.

**Implementation:**

The planner stores:
```cpp
std::unordered_map<TNodeID,std::vector<SDirectedEdge>> DShortEdges;
std::unordered_map<TNodeID,std::vector<SDirectedEdge>> DWalkEdges;
std::unordered_map<TNodeID,std::vector<SDirectedEdge>> DBikeEdges;
std::unordered_map<TNodeID,std::vector<SDirectedEdge>> DBusEdges;
```

#### Prompt 2: Parsing maxspeed Values Safely

**Question:**
How can I read OSM maxspeed values like "25 mph" without writing a complicated parser?

**Response:**
Strip the string, lowercase it, then walk the characters and collect the numeric prefix. Stop once you leave the number after collecting at least one numeric character. If no number exists, fall back to the default speed from the config.

**Implementation:**

The planner uses a helper that extracts digits and `.`:
```cpp
for(char c : s){
    if((c >= '0' && c <= '9') || c == '.'){
        n.push_back(c);
    }
    else if(!n.empty()){
        break;
    }
}
```

#### Prompt 3: Handling Path Description For Unnamed Roads

**Question:**
How should GetPathDescription decide what street name to use when the current segment has no name?

**Response:**
If the current segment is unnamed, switch the wording from `along` to `toward` and scan forward until you find the next named street. If none exists, use `End`.

**Implementation:**

The description builder does:
```cpp
word = "toward";
std::size_t k = j;
while(k < path.size() - 1){
    auto name = WayName(path[k].second, path[k + 1].second);
    if(!name.empty()){
        target = name;
        break;
    }
    k++;
}
```

#### Prompt 4: Converting Planner Paths Into Printable Trip Steps

**Question:**
What is a simple way to convert a node path and edge modes into the `TTripStep` format?

**Response:**
Walk the node list once and pair each node with the mode used to enter it. For the first node, use the first edge mode unless the path begins with a bus segment, in which case start with a walk step at the source.

**Implementation:**

The planner builds trip steps using:
```cpp
if(first == TMode::Bus){
    out.push_back(std::make_pair(TMode::Walk, nodes[0]));
}
else{
    out.push_back(std::make_pair(first, nodes[0]));
}
```

#### Prompt 5: Writing A Testable Command-Line Processor

**Question:**
How do I structure the command-line interface so it is easy to test with Google Mock instead of relying on std::cin and std::cout directly?

**Response:**
Use `CDataSource`, `CDataSink`, and `CDataFactory` everywhere inside the command-line class. Read one line at a time from the source, write strings through a helper function, and keep the last valid path in member state so `save` and `print` can reuse it.

**Implementation:**

The command-line class stores:
```cpp
std::shared_ptr<CDataSource> src;
std::shared_ptr<CDataSink> out;
std::shared_ptr<CDataSink> err;
std::shared_ptr<CDataFactory> factory;
std::shared_ptr<CTransportationPlanner> planner;
```

#### Prompt 6: Making The Dev Container Support Google Mock

**Question:**
The command-line tests need gmock, but the container only has partial googletest files. What is the clean way to fix that in the dev container?

**Response:**
Install `libgmock-dev`, then build googletest/googlemock from `/usr/src/googletest` with CMake. Copy the built static libraries into `/usr/local/lib`, link the headers into `/usr/local/include`, and run `ldconfig`.

**Implementation:**

The Dockerfile was updated to:
```dockerfile
cmake -S /usr/src/googletest -B /tmp/googletest-build && \
cmake --build /tmp/googletest-build && \
cp /tmp/googletest-build/lib/libgtest*.a /usr/local/lib/ && \
cp /tmp/googletest-build/lib/libgmock*.a /usr/local/lib/
```

#### Prompt 7: Preventing Makefile Test Targets From Overwriting Scripts

**Question:**
My Makefile run targets are accidentally overwriting the tracked `run_*` files with XML output. What is the simplest fix?

**Response:**
Send the XML output into `testtmp/` with a `.xml` extension and do not move it back into the repo root. Also mark the `run_*` targets as phony so Make always runs the commands instead of treating those tracked files as outputs.

**Implementation:**

The updated run targets use:
```makefile
$(TEST_TP_TARGET) --gtest_output=xml:$(TESTTMP_DIR)/$@.xml
```

and the run targets were added to `.PHONY`.

### Student 2 (Qi Gao) – BusSystemIndexer and DijkstraPathRouter Implementation Prompts

#### Prompt 1: Sorting Stops And Routes For Indexed Access

**Question:**
How do I support `SortedStopByIndex()` and `SortedRouteByIndex()` efficiently?

**Response:**
Copy all stops into a vector and sort them by stop ID.
Copy all routes into a vector and sort them by route name.
This makes indexed access easy after construction.
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
Use an `unordered_map<TNodeID, std::shared_ptr<SStop>>`.
The key is the node ID.
The value is the stop pointer.
During construction:
- Insert every stop into `DStopsByNodeID`
Then `StopByNodeID()` can use `.find()` directly.
If the node ID does not exist:
- Return `nullptr`

**Implementation:**

```cpp
for(size_t Index = 0; Index < DBusSystem->StopCount(); Index++){
    auto Stop = DBusSystem->StopByIndex(Index);
    DStopsByNodeID[Stop->NodeID()] = Stop;
}
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
Walk through every route.
For each consecutive pair of stops, convert the stop IDs into node IDs.
Store the route using the pair `(srcNodeID, destNodeID)` as the key.
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

<<<<<<< planner
**Response:**
Check the index before using it.
If the index is out of range, return `nullptr`.
This avoids invalid vector access and prevents crashes.

**Implementation:**

```cpp
if(index >= DSortedStopsByIndex.size()){
    return nullptr;
}
return DSortedStopsByIndex[index];
if(index >= DSortedRoutesByIndex.size()){
    return nullptr;
}
return DSortedRoutesByIndex[index];
```

#### Prompt 5: Representing The Graph In DijkstraPathRouter

**Question:**
How do I store the graph for Dijkstra's algorithm?

**Response:**
Store all vertices in a vector.
Each vertex stores a tag and a list of outgoing edges.
Each edge stores the weight and the destination vertex ID.
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
Verify that `src` is a valid vertex ID.
Verify that `dest` is a valid vertex ID.
Reject the edge if the weight is negative.
If `bidir` is true:
- Add the reverse edge too
If any input is invalid:
- Return `false`
=======
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
>>>>>>> main

**Implementation:**

```cpp
<<<<<<< planner
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
Use three vectors:
- `w` for shortest known distances
- `p` for previous vertex
- `v` for visited flags
Initialize every distance to infinity.
Set the source distance to 0.
Repeatedly choose the unvisited vertex with the smallest distance.
Relax all outgoing edges from that vertex.
Stop when:
- there are no more reachable vertices
- or the destination has been reached
=======
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
>>>>>>> main

**Implementation:**

```cpp
<<<<<<< planner
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
First check whether the destination is reachable.
If not reachable, return `NoPathExists`.
Otherwise, start from `dest` and move backward using the previous array.
Store the vertices in reverse order first.
Then push them into `path` in forward order.
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
Create valid vertices first.
Then try adding edges using invalid vertex IDs.
`AddEdge()` should return `false`.
This verifies:
- bounds checking works
- invalid edges are not inserted
=======
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
>>>>>>> main

**Implementation:**

```cpp
auto VertexA = PathRouter.AddVertex(std::string("A"));
auto VertexB = PathRouter.AddVertex(std::string("B"));

<<<<<<< planner
EXPECT_FALSE(PathRouter.AddEdge(VertexA, 10, 1.0));
EXPECT_FALSE(PathRouter.AddEdge(10, VertexB, 1.0));
```

#### Prompt 10: Testing Negative Edge Weights

**Question:**
How do I test that `AddEdge()` rejects negative weights?

**Response:**
Create two valid vertices.
Try adding an edge with a negative weight.
`AddEdge()` should return `false`.
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
Add one bidirectional edge from A to B.
Then search for a path from B back to A.
The path should exist and the distance should match the edge weight.
=======
EXPECT_FALSE(PathRouter.AddEdge(VertexA, VertexB, -1.0));
```

#### Prompt 11: Testing Bidirectional Edges

**Question:**
How do I test that `bidir = true` really adds both directions?

**Response:**
- Add one bidirectional edge from A to B.
- Then search for a path from B back to A.
- The path should exist and the distance should match the edge weight.

>>>>>>> main
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
<<<<<<< planner
Create a graph where one vertex is disconnected.
Try finding a path to the disconnected vertex.
The function should return `NoPathExists`.
The returned path should be empty.
=======
- Create a graph where one vertex is disconnected.
- Try finding a path to the disconnected vertex.
- The function should return `NoPathExists`.
- The returned path should be empty.

>>>>>>> main
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
