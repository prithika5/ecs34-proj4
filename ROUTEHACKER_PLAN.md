# RouteHacker Project Plan

## Status Snapshot

- Completed phases: `Phase 0`, `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`, `Phase 5`, `Phase 6`, `Phase 7`
- Partially completed phases: `None`
- Current priority: add screenshots/demo assets if desired and keep polishing the portfolio presentation

## Current Repo Reality

This repository started as a C++ transportation planner project with existing graph and Dijkstra-related logic.

That is useful for RouteHacker because:

- the repo already demonstrates routing and algorithmic thinking
- we can preserve the engineering story and evolve it into a startup-style MVP
- we can reuse concepts, data ideas, and validation cases while building a modern web product

## Git Setup

- Active working branch: `routehacker-mvp`
- Existing remote: `origin -> https://github.com/prithika5/ecs34-proj4.git`
- Recommendation: keep development on `routehacker-mvp`, then create a new GitHub repository named `routehacker` or `routehacker-app` and repoint `origin` before public launch
- Working rule: commit in small checkpoints as features land

## Product Scope

Version 1 will ship:

- route input form with start, end, and optimization mode
- backend route computation using in-house graph logic
- shortest and fastest route modes
- route summary cards with distance, time, and steps
- explanation engine based on deterministic backend logic
- strong validation and graceful errors
- responsive polished UI
- tests for critical backend and frontend flows
- professional README and deployment-ready structure

Stretch features will wait until after v1 is stable.

## Architecture Decision

We are turning this into a monorepo with:

- `client/` for the React + Vite frontend
- `server/` for the Node + Express backend
- `shared/` for shared RouteHacker metadata
- legacy C++ project files retained in root during migration

The backend currently implements the custom routing engine directly in JavaScript rather than calling an external routing API.

## Task Breakdown

## Phase 0: Repo Preparation

Status: `Completed`

- [x] Preserve current work and branch strategy.
- [x] Add a migration-oriented `.gitignore` for Node/Vite artifacts if needed.
- [x] Decide whether to keep the existing C++ code in root or move it into a `legacy/` folder for portfolio clarity.
- [x] Create the new monorepo folders and package manifests.
- [x] Add root scripts for local development.

Notes:

- We kept the C++ code in the root for now.
- Root workspace scripts and package management are in place.

## Phase 1: Full-Stack Scaffold

Status: `Completed`

- [x] Scaffold `client/` with React + Vite.
- [x] Scaffold `server/` with Express.
- [x] Set up shared linting/formatting choices only if they stay lightweight.
- [x] Add local dev scripts so frontend and backend run together.
- [x] Confirm both apps start cleanly.

Deliverable:

- [x] repo runs locally with one command or a very small set of commands

## Phase 2: Routing Domain Model

Status: `Completed`

- [x] Define RouteHacker location nodes.
- [x] Define weighted edges with distance, travel time, and travel mode.
- [x] Design the graph so shortest and fastest produce meaningfully different outputs.
- [x] Add route metadata helpers for formatting and explanation generation.

Deliverable:

- [x] realistic seed graph with deterministic sample routes

## Phase 3: Algorithm Engine

Status: `Completed`

- [x] Implement a graph module.
- [x] Implement Dijkstra for weighted shortest path.
- [x] Support optimization by total distance and total travel time.
- [x] Build route reconstruction logic.
- [x] Build explanation logic based on selected optimization and resulting tradeoffs.
- [x] Add edge-case handling for missing nodes, same start/end, and no route found.

Deliverable:

- [x] backend service can compute route payloads from pure input data

## Phase 4: API Layer

Status: `Completed`

- [x] Create `POST /api/route`.
- [x] Add request validation and normalized error responses.
- [x] Add controller/service separation.
- [x] Format API response for frontend consumption with summary, totals, ordered steps, and explanation.
- [x] Add health endpoint for deployment sanity checks.

Deliverable:

- [x] clean Express API with deterministic JSON output

## Phase 5: Frontend MVP

Status: `Completed`

- [x] Build polished page shell and branding for RouteHacker.
- [x] Create route input form.
- [x] Add segmented optimization control for shortest vs fastest.
- [x] Connect frontend to backend API.
- [x] Implement loading, success, and error states.
- [x] Render result cards for route summary, total distance, total time, route steps, and explanation.
- [x] Add responsive behavior for mobile and desktop.

Deliverable:

- [x] usable end-to-end web app with professional UI

## Phase 6: Product Polish

Status: `Completed`

- [x] Improve typography, spacing, and visual hierarchy.
- [x] Add small feature summary section and product framing copy.
- [x] Make empty state feel intentional, not unfinished.
- [x] Refine copywriting and error messages.
- [x] Ensure the app feels like a startup MVP, not a class demo.

Deliverable:

- [x] portfolio-grade presentation quality

## Phase 7: Testing

Status: `Completed`

- [x] Backend tests for valid route, shortest mode, fastest mode, invalid location, same start/end, and no route found.
- [x] Frontend tests for form render, validation, API trigger, loading state, error state, and results render.

Deliverable:

- [x] confidence on the core routing and UI flows

## Phase 8: Documentation and Deployment

Status: `Completed`

- [x] Rewrite the README around RouteHacker.
- [x] Document architecture and algorithm choices.
- [x] Add setup and test commands.
- [x] Add deployment instructions.
- [x] Deploy frontend to Vercel.
- [x] Deploy backend to Render.
- [x] Add final repo polish with demo links and clear folder overview.

Deliverable:

- [x] publicly presentable submission repository

## Open Decisions To Resolve During Build

- whether to keep the existing C++ planner in the main root or archive it into `legacy/`
- whether the backend should remain JavaScript or move to TypeScript
- whether styling should stay plain CSS or evolve into a design system
- whether v1 should ship route comparison view or keep it for stretch scope

## Recommended Execution Order From Here

1. Add screenshots from the live app if you want a stronger portfolio README.
2. Optionally move the repo to a dedicated `routehacker` GitHub repository later.
3. Share the deployed app and repo as the final portfolio artifact.

## Success Criteria

RouteHacker is ready for portfolio use when:

- shortest and fastest routes both work correctly
- the UI feels clean and intentional on mobile and desktop
- the codebase is easy to review quickly
- the app is deployed publicly
- the README clearly explains the engineering value of the project
