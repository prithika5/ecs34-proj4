import { createApiError } from "../lib/errors.js";
import { canUseCppPlanner, computeCppRoute } from "./cppPlannerService.js";
import { computeLegacyRoute } from "./legacyRouteService.js";

function getEngineMode() {
  if (process.env.ROUTE_ENGINE) {
    return process.env.ROUTE_ENGINE;
  }

  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return "demo";
  }

  return "auto";
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

export async function computeRoute(request) {
  validateRequest(request);

  const { modePreference = "any" } = request;
  const engineMode = getEngineMode();
  const shouldUseCpp = engineMode === "cpp" || (engineMode === "auto" && (await canUseCppPlanner(request)));

  if (shouldUseCpp) {
    try {
      return withEngineMetadata(await computeCppRoute(request), "cpp");
    } catch (error) {
      if (modePreference === "any") {
        return withEngineMetadata(computeLegacyRoute(request), "demo-fallback", error.body?.error?.message || error.message);
      }
      throw error;
    }
  }

  return withEngineMetadata(
    computeLegacyRoute(request),
    modePreference === "any" ? "demo-fallback" : "demo",
    modePreference === "any" ? "C++ planner unavailable, using legacy seeded graph." : ""
  );
}
