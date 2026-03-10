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

Speed-performance extra credit tuning against the provided optimized baseline was not completed. The `speedtest` program builds and runs, but no extra optimization pass was done beyond the functional implementation.

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
