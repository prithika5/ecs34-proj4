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

### Student 2 (Qi Gao) – CSVBusSystem Implementation Prompts

#### Prompt 1: Grouping Route Rows Into A Single Route Object

**Question:**
routes.csv has multiple rows for the same route name (e.g., A,1 A,2 A,3). How do I combine those into one Route object?

**Response:**
- Read the header first to locate the route and stop_id columns.
- Then read each row and use an unordered_map<string, shared_ptr<SRoute>> to group rows by route name.

If the route name appears for the first time:
- Create a new SRoute
- Store its name
- Push it into DRoutesByIndex
- Add it to DRoutesByName

- Then, for every row, append the stop ID into that route's DStopIDs vector.

**Implementation:**

```cpp
while(ReadRow(row)){
    name = row[routeCol];
    id = stoull(row[stopCol]);

    if(route not yet created)
        create new route

    route->DStopIDs.push_back(id);
}
```

#### Prompt 2: Handling Missing CSV Headers Safely

**Question:**
What should I do if required headers (like stop_id, node_id, or route) are missing?

**Response:**
- After reading the header row, scan for required column names.
- If any required column is missing, return false immediately instead of continuing to parse.
- This prevents invalid memory access and ensures construction fails safely.

**Implementation:**

- ReadStops() checks for stop_id and node_id.
- ReadRoutes() checks for route and stop_id.
- If any column is missing, the function returns false.

#### Prompt 3: Handling Invalid Index And Missing IDs

**Question:**
What should functions return when an index is out of bounds or an ID does not exist?

**Response:**
To avoid crashes:
- StopByIndex() and StopByID() return nullptr if not found.
- GetStopID(index) returns CBusSystem::InvalidStopID if the index is invalid.

This keeps behavior consistent and safe.

**Implementation:**

- Used bounds checks for vectors and .find() for maps.
- Returned nullptr or InvalidStopID when appropriate.

#### Prompt 4: Why Use Both Vector And Unordered_Map?

**Question:**
Why store both a vector and a map for stops and routes? Isn't one enough?

**Response:**
Each data structure serves a different purpose:
- vector preserves insertion order and allows fast access by index.
- unordered_map allows fast lookup by ID or name.

Using both ensures:
- StopByIndex() is efficient
- StopByID() is efficient
- Order remains consistent

**Implementation:**

Stops:
- DStopsByIndex
- DStopsByID

Routes:
- DRoutesByIndex
- DRoutesByName

Both structures are populated during parsing.

#### Prompt 5: Debugging When Git Does Not Detect File Changes

**Question:**
Why did git status show no changes even after modifying files?

**Response:**
The issue was editing the wrong directory. There were two copies:
- /workspace/ecs34-project3/ (actual git repo)
- /workspace/ (outer directory, not tracked)

Changes made outside the repository were not tracked by git.

**Implementation:**

Used:
```bash
pwd
realpath filename
```
