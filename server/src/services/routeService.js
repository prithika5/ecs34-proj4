import { graph } from "../data/graph.js";
import { createApiError } from "../lib/errors.js";

const validOptimizations = new Set(["shortest", "fastest"]);

function buildAdjacency(edges) {
  const adjacency = new Map();

  for (const edge of edges) {
    const forward = { ...edge };
    const reverse = { ...edge, from: edge.to, to: edge.from };

    if (!adjacency.has(forward.from)) {
      adjacency.set(forward.from, []);
    }

    if (!adjacency.has(reverse.from)) {
      adjacency.set(reverse.from, []);
    }

    adjacency.get(forward.from).push(forward);
    adjacency.get(reverse.from).push(reverse);
  }

  return adjacency;
}

const adjacency = buildAdjacency(graph.edges);

function getWeight(edge, optimization) {
  return optimization === "fastest" ? edge.time : edge.distance;
}

function formatDistance(distance) {
  return `${distance.toFixed(2)} mi`;
}

function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

function toTitleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function reconstructRoute(previous, start, end) {
  const path = [];
  let current = end;

  while (current && current !== start) {
    const edge = previous.get(current);

    if (!edge) {
      return null;
    }

    path.unshift(edge);
    current = edge.from;
  }

  return path;
}

function explainRoute(route, optimization) {
  const modeCount = route.steps.reduce((count, step) => {
    count[step.mode] = (count[step.mode] || 0) + 1;
    return count;
  }, {});

  const dominantMode = Object.entries(modeCount).sort((left, right) => right[1] - left[1])[0]?.[0] || "walk";
  const tradeoff =
    optimization === "fastest"
      ? "It prioritizes low travel time even when the total distance is slightly longer."
      : "It stays compact on distance even if that means a slower overall pace.";

  return `${toTitleCase(optimization)} mode leans on ${dominantMode} segments. ${tradeoff}`;
}

function buildHighlights(steps, optimization) {
  const modeCount = steps.reduce((count, step) => {
    count[step.mode] = (count[step.mode] || 0) + 1;
    return count;
  }, {});

  const dominantMode = Object.entries(modeCount).sort((left, right) => right[1] - left[1])[0]?.[0] || "walk";

  return {
    dominantMode,
    stepCount: steps.length,
    tradeoffLabel: optimization === "fastest" ? "Saves time" : "Cuts distance",
    campusFeel:
      optimization === "fastest"
        ? "Shuttle and bike links do most of the heavy lifting on this trip."
        : "This route stays compact and campus-centric even if it takes longer."
  };
}

export function computeRoute({ start, end, optimization }) {
  if (!graph.nodes[start] || !graph.nodes[end]) {
    throw createApiError(400, "INVALID_LOCATION", "Start and end must be valid RouteHacker locations.");
  }

  if (!validOptimizations.has(optimization)) {
    throw createApiError(400, "INVALID_OPTIMIZATION", "Optimization must be either shortest or fastest.");
  }

  if (start === end) {
    throw createApiError(400, "SAME_LOCATION", "Choose two different locations to compute a route.");
  }

  const distances = new Map(Object.keys(graph.nodes).map((nodeId) => [nodeId, Number.POSITIVE_INFINITY]));
  const previous = new Map();
  const unvisited = new Set(Object.keys(graph.nodes));

  distances.set(start, 0);

  while (unvisited.size > 0) {
    let current = null;
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const nodeId of unvisited) {
      const candidate = distances.get(nodeId);

      if (candidate < currentDistance) {
        current = nodeId;
        currentDistance = candidate;
      }
    }

    if (current === null || currentDistance === Number.POSITIVE_INFINITY) {
      break;
    }

    if (current === end) {
      break;
    }

    unvisited.delete(current);

    const edges = adjacency.get(current) || [];
    for (const edge of edges) {
      if (!unvisited.has(edge.to)) {
        continue;
      }

      const tentativeDistance = currentDistance + getWeight(edge, optimization);

      if (tentativeDistance < distances.get(edge.to)) {
        distances.set(edge.to, tentativeDistance);
        previous.set(edge.to, edge);
      }
    }
  }

  const steps = reconstructRoute(previous, start, end);

  if (!steps || steps.length === 0) {
    throw createApiError(404, "ROUTE_NOT_FOUND", "No connected route exists for the requested locations.");
  }

  const totals = steps.reduce(
    (summary, step) => ({
      distance: summary.distance + step.distance,
      time: summary.time + step.time
    }),
    { distance: 0, time: 0 }
  );

  const routeSteps = steps.map((step, index) => ({
    index: index + 1,
    instruction: `Take the ${step.label} from ${graph.nodes[step.from].label} to ${graph.nodes[step.to].label}.`,
    from: graph.nodes[step.from].label,
    to: graph.nodes[step.to].label,
    mode: step.mode,
    distance: formatDistance(step.distance),
    time: formatTime(step.time)
  }));

  return {
    summary: `${graph.nodes[start].label} to ${graph.nodes[end].label}`,
    optimization,
    totals: {
      distance: formatDistance(totals.distance),
      time: formatTime(totals.time),
      rawDistance: Number(totals.distance.toFixed(2)),
      rawTime: totals.time
    },
    steps: routeSteps,
    explanation: explainRoute({ steps: routeSteps }, optimization),
    highlights: buildHighlights(routeSteps, optimization)
  };
}
