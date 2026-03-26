# RouteHacker

RouteHacker is a portfolio-style routing MVP built on top of this repository's transportation-planning background. The original C++ planner remains in place, and a new React + Express monorepo now sits alongside it for a modern product-facing demo.

## What Ships In This MVP

- React + Vite frontend in `client/`
- Express backend in `server/`
- Deterministic shortest-vs-fastest routing with an in-house graph engine
- Route summaries, step-by-step directions, and explanation copy
- Validation for bad requests, same-point trips, and disconnected routes
- Backend and frontend tests for the core flows
- Dev container support for both the legacy C++ toolchain and the new web stack

## Dev Container

Open the repository in the provided dev container at [.devcontainer/devcontainer.json](/workspaces/RouteApp-AggieWorks/.devcontainer/devcontainer.json). The container installs:

- C++ build and test dependencies for the legacy planner
- Node.js and npm for the RouteHacker client/server workspaces
- VS Code extensions for C++, ESLint, Prettier, TypeScript, and Vitest

The container runs `npm install` after creation so the web workspaces are ready once the container finishes provisioning.

## Local Commands

From the repo root:

```bash
npm install
npm run dev
```

That starts:

- the API at `http://localhost:3000`
- the client at `http://localhost:5173`

Other useful commands:

```bash
npm run test
npm run test:server
npm run test:client
npm run build
make
```

## Architecture

### Web App

- `client/`: React UI for route input, loading states, result cards, and product framing
- `server/`: Express API plus the deterministic routing engine
- `shared/`: location and optimization metadata shared across the stack

### Legacy Planner

The original C++ transportation planner stays in the root-level `src/`, `include/`, `testsrc/`, and `Makefile` structure. That preserves the project history and makes the migration story easy to review.

## Folder Overview

```text
.
├── client/        React + Vite frontend
├── server/        Express API and routing engine
├── shared/        Shared RouteHacker metadata
├── src/           Legacy C++ implementation
├── include/       Legacy C++ headers
├── testsrc/       Legacy C++ tests
└── .devcontainer/ Dev container configuration
```

## Routing Model

The MVP uses a seeded campus-style graph with weighted edges for:

- distance
- travel time
- travel mode

The shortest route minimizes distance. The fastest route minimizes total travel time. Because the graph mixes walking, biking, and shuttle edges, those two strategies can produce meaningfully different outputs for the same start and end points.

## API Contract

`POST /api/route`

Request body:

```json
{
  "start": "aggie_works",
  "end": "west_village",
  "optimization": "fastest"
}
```

Success response includes:

- `summary`
- `optimization`
- `totals`
- `steps`
- `explanation`

The API also exposes `GET /api/health` for container and deployment sanity checks.

## Testing

Backend coverage currently includes:

- valid route requests
- shortest vs fastest differences
- invalid locations
- same start and end
- disconnected nodes

Frontend coverage currently includes:

- form render
- client-side validation
- loading state
- success render
- API error render

## Deployment

### Frontend on Vercel

Create a Vercel project with the root directory set to `client/`.

Set this environment variable in Vercel:

```bash
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Use these commands:

```bash
Build command: npm run build
Output directory: dist
```

### Backend on Render

The repository includes [render.yaml](/workspaces/RouteApp-AggieWorks/render.yaml) for a basic Render web service.

If you configure the service manually instead, use:

```bash
Root directory: server
Build command: npm install
Start command: npm run start
```

Set this environment variable in Render after you know the frontend URL:

```bash
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
```

For local development, the API still defaults to permissive CORS so the dev container workflow stays simple.

## Notes

- `research_park` is intentionally disconnected in the seed graph so the API can exercise the no-route-found path.
- Styling uses plain CSS rather than Tailwind to keep the MVP lightweight inside this mixed-language repository.
- Deployment now supports an environment-configured frontend API base URL and optional production CORS restriction.

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
Create a graph where one vertex is disconnected.
Try finding a path to the disconnected vertex.
The function should return `NoPathExists`.
The returned path should be empty.
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
