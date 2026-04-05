import { createApiError } from "../lib/errors.js";
import { canUseCppPlanner, computeCppRoute } from "./cppPlannerService.js";
import { computeLegacyRoute } from "./legacyRouteService.js";

const CACHE_TTL_MS = 30_000;
const routeCache = new Map();
const inflightRequests = new Map();

function getEngineMode() {
  if (process.env.ROUTE_ENGINE) {
    return process.env.ROUTE_ENGINE;
  }

  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return "cpp";
  }

  return "cpp";
}

function validateRequest({ start, end, optimization, modePreference = "any" }) {
  if (!start || !end || !optimization) {
    throw createApiError(400, "INVALID_REQUEST", "start, end, and optimization are required.");
  }

  if (start === end) {
    throw createApiError(400, "SAME_LOCATION", "Choose two different locations to compute a route.");
  }

  if (!["shortest", "fastest"].includes(optimization)) {
    throw createApiError(400, "INVALID_OPTIMIZATION", "Optimization must be either shortest or fastest.");
  }

  if (!["any", "walk", "bike", "shuttle"].includes(modePreference)) {
    throw createApiError(400, "INVALID_MODE_PREFERENCE", "Mode preference must be any, walk, bike, or shuttle.");
  }
}

function withEngineMetadata(route, engine, fallbackReason = "") {
  return {
    ...route,
    engine,
    fallbackReason
  };
}

function buildCacheKey(request) {
  return JSON.stringify(request);
}

function readCache(cacheKey) {
  const cached = routeCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    routeCache.delete(cacheKey);
    return null;
  }

  return cached.value;
}

function writeCache(cacheKey, value) {
  routeCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

async function computeFreshRoute(request) {
  const { modePreference = "any" } = request;
  const engineMode = getEngineMode();
  const shouldUseCpp = engineMode === "cpp" || (engineMode === "auto" && (await canUseCppPlanner(request)));

  if (shouldUseCpp) {
    return withEngineMetadata(await computeCppRoute(request), "cpp");
  }

  return withEngineMetadata(
    computeLegacyRoute(request),
    modePreference === "any" ? "demo-fallback" : "demo",
    modePreference === "any" ? "C++ planner unavailable, using legacy seeded graph." : ""
  );
}

export async function computeRoute(request) {
  validateRequest(request);

  const cacheKey = buildCacheKey(request);
  const cached = readCache(cacheKey);

  if (cached) {
    return cached;
  }

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const pending = computeFreshRoute(request)
    .then((route) => {
      writeCache(cacheKey, route);
      return route;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, pending);
  return pending;
}
