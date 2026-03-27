# RouteHacker

RouteHacker is a full-stack routing app layered on top of this repository's original ECS 34 Project 4 transportation planner. The React frontend and Express backend stay in place, but `/api/route` can now call the real C++ OpenStreetMap-based planner through a subprocess adapter instead of relying only on the seeded demo graph.

## Live Demo

- Frontend: `https://routehacker.vercel.app`
- Backend API: `https://routehacker-api.onrender.com`

## What This Project Shows

- React + Vite frontend in `client/`
- Express backend in `server/`
- Real C++ transportation planner from the ECS 34 codebase
- OpenStreetMap + bus-system routing data from `data/`
- Full-screen Mapbox map with floating trip planning UI
- Shortest-vs-fastest route computation
- Searchable Davis pickup and destination selection with map click support
- Legacy seeded graph fallback for unsupported/demo-only cases
- Frontend and backend tests
- Dev container support for both the C++ and web stacks

## Architecture

### Request Flow

1. The React app lets the user choose a start and destination by search or map click, then submits `start`, `end`, `optimization`, and `modePreference` to `POST /api/route`.
2. The Express backend validates the request in [server/src/routes/routeRouter.js](/workspaces/RouteApp-AggieWorks/server/src/routes/routeRouter.js).
3. The route service in [server/src/services/routeService.js](/workspaces/RouteApp-AggieWorks/server/src/services/routeService.js) chooses an engine:
   - `cpp`: use the real ECS 34 planner via subprocess
   - `demo` / `demo-fallback`: use the legacy seeded graph
4. The C++ adapter executable [src/routeplanner_web.cpp](/workspaces/RouteApp-AggieWorks/src/routeplanner_web.cpp) loads `davis.osm`, `stops.csv`, and `routes.csv`, computes a route, and returns JSON.
5. Express forwards the normalized route payload back to the frontend, including route geometry for the map polyline and a compact transportation breakdown for the floating trip card.

### Why The Fallback Still Exists

The web app currently exposes a `modePreference` filter (`walk`, `bike`, `shuttle`) that the original C++ planner API does not yet expose directly. For requests that the C++ adapter cannot satisfy yet, the backend falls back to the seeded demo graph in [server/src/services/legacyRouteService.js](/workspaces/RouteApp-AggieWorks/server/src/services/legacyRouteService.js). That keeps the current product surface working while the real planner integration is being expanded.

## Key Files

- [src/routeplanner_web.cpp](/workspaces/RouteApp-AggieWorks/src/routeplanner_web.cpp): non-interactive C++ adapter for web requests
- [src/transplanner.cpp](/workspaces/RouteApp-AggieWorks/src/transplanner.cpp): original CLI entry point
- [src/DijkstraTransportationPlanner.cpp](/workspaces/RouteApp-AggieWorks/src/DijkstraTransportationPlanner.cpp): core ECS 34 routing logic
- [server/src/services/cppPlannerService.js](/workspaces/RouteApp-AggieWorks/server/src/services/cppPlannerService.js): Node subprocess bridge to the C++ adapter
- [server/src/services/routeService.js](/workspaces/RouteApp-AggieWorks/server/src/services/routeService.js): engine selection and fallback orchestration
- [server/src/services/legacyRouteService.js](/workspaces/RouteApp-AggieWorks/server/src/services/legacyRouteService.js): old seeded graph engine preserved as legacy mode
- [shared/routeOptions.js](/workspaces/RouteApp-AggieWorks/shared/routeOptions.js): shared UI metadata plus location coordinates for the adapter

## Local Setup

### Dev Container

Open the repository in the provided dev container at [.devcontainer/devcontainer.json](/workspaces/RouteApp-AggieWorks/.devcontainer/devcontainer.json). The container includes both the legacy C++ toolchain and the Node-based web stack.

### Install Dependencies

From the repo root:

```bash
npm install
```

### Set Environment Variables

Create `client/.env` from `client/.env.example` and set:

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_public_token
```

### Build The C++ Web Adapter

From the repo root:

```bash
npm run build:planner
```

That builds:

```text
bin/routeplanner_web
```

### Run The Integrated Stack

After the adapter is built:

```bash
npm run dev
```

That starts:

- the API at `http://localhost:3000`
- the client at `http://localhost:5173`

If the C++ adapter binary is missing, the backend automatically falls back to the seeded demo engine for `auto` mode.

## Engine Control

The backend supports an engine switch through `ROUTE_ENGINE`:

- `auto`: use the C++ planner when available, otherwise fall back
- `cpp`: require the C++ planner
- `demo`: always use the seeded demo graph

Example:

```bash
ROUTE_ENGINE=cpp npm run dev --workspace server
```

## API Contract

`POST /api/route`

Request body:

```json
{
  "start": "aggie_works",
  "end": "west_village",
  "optimization": "fastest",
  "modePreference": "any"
}
```

Success response includes:

- `summary`
- `optimization`
- `modePreference`
- `totals`
- `geometry`
- `steps`
- `breakdown`
- `explanation`
- `highlights`
- `engine`

The API also exposes `GET /api/health`.

## Testing

Useful commands:

```bash
npm run test
npm run test:server
npm run test:client
npm run build
make
```

The automated tests run in demo mode for determinism and speed. The real C++ planner path was also smoke-tested locally by compiling `bin/routeplanner_web` and invoking it through the Express service.

## Legacy Planner

The original ECS 34 Project 4 C++ planner still lives in:

- `src/`
- `include/`
- `testsrc/`
- `Makefile`

That preserves the course project structure while the web app demonstrates how the planner can be wrapped as a product-facing service.
