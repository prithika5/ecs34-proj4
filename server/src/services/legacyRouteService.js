import { graph } from "../data/graph.js";
import { createApiError } from "../lib/errors.js";
import { getLocationOptionById } from "../../../shared/routeOptions.js";

const validOptimizations = new Set(["shortest", "fastest"]);
const validModePreferences = new Set(["any", "walk", "bike", "shuttle"]);

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

function edgeMatchesPreference(edge, modePreference) {
  return modePreference === "any" || edge.mode === modePreference;
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

function getTransferPenalty(previousMode, nextMode, optimization) {
  if (!previousMode || previousMode === nextMode) {
    return 0;
  }

  if (optimization === "fastest") {
    return previousMode === "shuttle" || nextMode === "shuttle" ? 2 : 1;
  }

  return 0.12;
}

function getEdgeCost(edge, optimization, previousMode) {
  const baseCost = optimization === "fastest" ? edge.time : edge.distance;
  const transferPenalty = getTransferPenalty(previousMode, edge.mode, optimization);
  const tieBreaker = optimization === "fastest" ? edge.distance * 0.05 : edge.time * 0.005;

  return baseCost + transferPenalty + tieBreaker;
}

function buildStateKey(nodeId, mode) {
  return `${nodeId}::${mode || "start"}`;
}

function reconstructRoute(previous, start, endStateKey) {
  const path = [];
  let currentStateKey = endStateKey;

  while (currentStateKey) {
    const entry = previous.get(currentStateKey);

    if (!entry) {
      break;
    }

    path.unshift(entry.edge);
    currentStateKey = entry.previousStateKey;
  }

  if (!path.length || path[0].from !== start) {
    return null;
  }

  return path;
}

function explainRoute(route, optimization, modePreference) {
  const modeCount = route.steps.reduce((count, step) => {
    count[step.mode] = (count[step.mode] || 0) + 1;
    return count;
  }, {});

  const dominantMode = Object.entries(modeCount).sort((left, right) => right[1] - left[1])[0]?.[0] || "walk";
  const tradeoff =
    optimization === "fastest"
      ? "Prioritizes lower travel time and avoids unnecessary transfers."
      : "Keeps the route compact while preferring cleaner, more direct segments.";

  const preferenceNote = modePreference !== "any" ? ` Uses ${modePreference} only.` : "";

  return `${toTitleCase(optimization)} route with mostly ${dominantMode} segments.${preferenceNote} ${tradeoff}`;
}

function buildHighlights(steps, optimization, modePreference) {
  const modeCount = steps.reduce((count, step) => {
    count[step.mode] = (count[step.mode] || 0) + 1;
    return count;
  }, {});

  const dominantMode = Object.entries(modeCount).sort((left, right) => right[1] - left[1])[0]?.[0] || "walk";

  return {
    dominantMode,
    stepCount: steps.length,
    tradeoffLabel: optimization === "fastest" ? "Saves time" : "Cuts distance",
    modePreference
  };
}

function buildGeometry(pathSteps, start) {
  const coordinates = [];
  const startLocation = getLocationOptionById(start);

  if (startLocation?.coordinates) {
    coordinates.push([startLocation.coordinates.longitude, startLocation.coordinates.latitude]);
  }

  for (const step of pathSteps) {
    const nextLocation = getLocationOptionById(step.to);
    if (nextLocation?.coordinates) {
      coordinates.push([nextLocation.coordinates.longitude, nextLocation.coordinates.latitude]);
    }
  }

  return {
    type: "LineString",
    coordinates
  };
}

function buildBreakdown(steps) {
  const breakdown = new Map();

  for (const step of steps) {
    if (!breakdown.has(step.mode)) {
      breakdown.set(step.mode, {
        mode: step.mode,
        label: toTitleCase(step.mode),
        stepCount: 0,
        rawDistance: 0,
        rawTime: 0
      });
    }

    const summary = breakdown.get(step.mode);
    summary.stepCount += 1;
    summary.rawDistance += step.distanceValue;
    summary.rawTime += step.timeValue;
  }

  return Array.from(breakdown.values()).map((summary) => ({
    ...summary,
    distance: formatDistance(summary.rawDistance),
    time: formatTime(summary.rawTime)
  }));
}

function computeBestPath(start, end, optimization, modePreference) {
  const distances = new Map();
  const previous = new Map();
  const frontier = [
    {
      stateKey: buildStateKey(start, null),
      nodeId: start,
      previousMode: null,
      cost: 0,
      steps: 0
    }
  ];

  distances.set(buildStateKey(start, null), {
    cost: 0,
    steps: 0
  });

  let bestEndStateKey = null;
  let bestEndScore = Number.POSITIVE_INFINITY;
  let bestEndSteps = Number.POSITIVE_INFINITY;

  while (frontier.length > 0) {
    frontier.sort((left, right) => {
      if (left.cost !== right.cost) {
        return left.cost - right.cost;
      }

      return left.steps - right.steps;
    });

    const current = frontier.shift();
    const recorded = distances.get(current.stateKey);

    if (!recorded || current.cost > recorded.cost || (current.cost === recorded.cost && current.steps > recorded.steps)) {
      continue;
    }

    if (current.nodeId === end) {
      bestEndStateKey = current.stateKey;
      bestEndScore = current.cost;
      bestEndSteps = current.steps;
      break;
    }

    const edges = adjacency.get(current.nodeId) || [];

    for (const edge of edges) {
      if (!edgeMatchesPreference(edge, modePreference)) {
        continue;
      }

      const nextStateKey = buildStateKey(edge.to, edge.mode);
      const nextCost = current.cost + getEdgeCost(edge, optimization, current.previousMode);
      const nextSteps = current.steps + 1;
      const previousBest = distances.get(nextStateKey);

      if (
        previousBest &&
        (previousBest.cost < nextCost || (previousBest.cost === nextCost && previousBest.steps <= nextSteps))
      ) {
        continue;
      }

      distances.set(nextStateKey, {
        cost: nextCost,
        steps: nextSteps
      });
      previous.set(nextStateKey, {
        edge,
        previousStateKey: current.stateKey
      });
      frontier.push({
        stateKey: nextStateKey,
        nodeId: edge.to,
        previousMode: edge.mode,
        cost: nextCost,
        steps: nextSteps
      });
    }
  }

  if (!bestEndStateKey || !Number.isFinite(bestEndScore) || !Number.isFinite(bestEndSteps)) {
    return null;
  }

  return reconstructRoute(previous, start, bestEndStateKey);
}

export function computeLegacyRoute({ start, end, optimization, modePreference = "any" }) {
  if (!graph.nodes[start] || !graph.nodes[end]) {
    throw createApiError(400, "INVALID_LOCATION", "Start and end must be valid RouteHacker locations.");
  }

  if (!validOptimizations.has(optimization)) {
    throw createApiError(400, "INVALID_OPTIMIZATION", "Optimization must be either shortest or fastest.");
  }

  if (!validModePreferences.has(modePreference)) {
    throw createApiError(400, "INVALID_MODE_PREFERENCE", "Mode preference must be any, walk, bike, or shuttle.");
  }

  if (start === end) {
    throw createApiError(400, "SAME_LOCATION", "Choose two different locations to compute a route.");
  }

  const steps = computeBestPath(start, end, optimization, modePreference);

  if (!steps || steps.length === 0) {
    const message =
      modePreference === "any"
        ? "No connected route exists for the requested locations."
        : `No ${modePreference} route exists for the requested locations.`;

    throw createApiError(404, "ROUTE_NOT_FOUND", message);
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
    instruction: `${toTitleCase(step.mode)} via ${step.label} from ${graph.nodes[step.from].label} to ${graph.nodes[step.to].label}.`,
    from: graph.nodes[step.from].label,
    to: graph.nodes[step.to].label,
    fromId: step.from,
    toId: step.to,
    mode: step.mode,
    distanceValue: step.distance,
    timeValue: step.time,
    distance: formatDistance(step.distance),
    time: formatTime(step.time)
  }));

  return {
    engine: "demo",
    summary: `${graph.nodes[start].label} to ${graph.nodes[end].label}`,
    optimization,
    modePreference,
    totals: {
      distance: formatDistance(totals.distance),
      time: formatTime(totals.time),
      rawDistance: Number(totals.distance.toFixed(2)),
      rawTime: totals.time
    },
    geometry: buildGeometry(steps, start),
    steps: routeSteps,
    breakdown: buildBreakdown(routeSteps),
    explanation: explainRoute({ steps: routeSteps }, optimization, modePreference),
    highlights: buildHighlights(routeSteps, optimization, modePreference)
  };
}
