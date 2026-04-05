import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApiError } from "../lib/errors.js";
import { getLocationOptionById } from "../../../shared/routeOptions.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");
const defaultBinaryPath = path.join(repoRoot, "bin", "routeplanner_web");
const defaultDataPath = path.join(repoRoot, "data");
const defaultTimeoutMs = Number(process.env.CPP_PLANNER_TIMEOUT_MS || 30000);

function getBinaryPath() {
  return process.env.CPP_PLANNER_BINARY || defaultBinaryPath;
}

function getDataPath() {
  return process.env.CPP_PLANNER_DATA || defaultDataPath;
}

async function binaryExists(binaryPath) {
  try {
    await access(binaryPath);
    return true;
  } catch {
    return false;
  }
}

function resolveLocationPayload(locationId, role) {
  const location = getLocationOptionById(locationId);

  if (!location?.coordinates) {
    throw createApiError(400, "INVALID_LOCATION", `Missing ${role} coordinates for ${locationId}.`);
  }

  return {
    id: location.id,
    label: location.label,
    latitude: location.coordinates.latitude,
    longitude: location.coordinates.longitude
  };
}

function normalizeAdapterError(stderr, errorMessage) {
  const combined = `${stderr || ""} ${errorMessage || ""}`.trim();
  const match = combined.match(/\{.*"error".*\}/s);

  if (!match) {
    return createApiError(502, "CPP_PLANNER_FAILED", "The C++ route planner did not return valid output.");
  }

  try {
    const parsed = JSON.parse(match[0]);
    return createApiError(502, parsed.error?.code || "CPP_PLANNER_FAILED", parsed.error?.message || "The C++ route planner failed.");
  } catch {
    return createApiError(502, "CPP_PLANNER_FAILED", "The C++ route planner returned malformed JSON.");
  }
}

function parseDistanceMiles(distanceText = "") {
  const match = distanceText.match(/([0-9]+(?:\.[0-9]+)?)\s*mi/);
  return match ? Number(match[1]) : 0;
}

function parseTimeMinutes(timeText = "") {
  const hourMinuteMatch = timeText.match(/(?:(\d+)\s*hr)?(?:\s*(\d+)\s*min)?/);

  if (!hourMinuteMatch) {
    return 0;
  }

  const hours = Number(hourMinuteMatch[1] || 0);
  const minutes = Number(hourMinuteMatch[2] || 0);
  return hours * 60 + minutes;
}

function formatDistanceMiles(distanceMiles) {
  return `${distanceMiles.toFixed(2)} mi`;
}

function formatTimeMinutes(totalMinutes) {
  const roundedMinutes = Math.round(totalMinutes);

  if (roundedMinutes < 60) {
    return `${roundedMinutes} min`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

function formatMode(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function isTinyConnectorStep(step) {
  return step.mode === "walk" && /toward/i.test(step.instruction || "") && parseDistanceMiles(step.distance) <= 0.03;
}

function formatShuttleInstruction(instruction) {
  const busMatch = instruction.match(/^Take Bus ([A-Za-z0-9]+) from stop \d+ to stop \d+$/);
  return busMatch ? `Ride Bus ${busMatch[1]}` : instruction;
}

function summarizeGroupedInstruction(group) {
  if (group.mode === "shuttle") {
    const routeIds = group.items
      .map((step) => step.instruction.match(/^Take Bus ([A-Za-z0-9]+)/)?.[1])
      .filter(Boolean);

    if (!routeIds.length) {
      return "Ride transit";
    }

    if (routeIds.length === 1) {
      return `Ride Bus ${routeIds[0]}`;
    }

    return `Ride Buses ${routeIds.join(", ")}`;
  }

  if (group.mode === "bike") {
    return `Bike for ${formatDistanceMiles(group.rawDistance)}`;
  }

  return `Walk for ${formatDistanceMiles(group.rawDistance)}`;
}

function collapseSteps(steps = []) {
  const filteredSteps = steps.filter((step) => !isTinyConnectorStep(step));

  if (!filteredSteps.length) {
    return [];
  }

  const grouped = [];

  for (const step of filteredSteps) {
    const rawDistance = parseDistanceMiles(step.distance);
    const rawTime = parseTimeMinutes(step.time);
    const previous = grouped[grouped.length - 1];
    const canMerge =
      previous &&
      previous.mode === step.mode &&
      (step.mode !== "shuttle" || previous.items.length < 2);

    if (canMerge) {
      previous.items.push(step);
      previous.rawDistance += rawDistance;
      previous.rawTime += rawTime;
      continue;
    }

    grouped.push({
      mode: step.mode,
      items: [step],
      rawDistance,
      rawTime
    });
  }

  return grouped.map((group, index) => {
    const [firstStep] = group.items;
    const isSingleStep = group.items.length === 1;

    return {
      index: index + 1,
      mode: group.mode,
      distance: group.rawDistance > 0 ? formatDistanceMiles(group.rawDistance) : "",
      time: group.rawTime > 0 ? formatTimeMinutes(group.rawTime) : "",
      rawDistance: Number(group.rawDistance.toFixed(2)),
      rawTime: Math.round(group.rawTime),
      instruction: isSingleStep
        ? group.mode === "shuttle"
          ? formatShuttleInstruction(firstStep.instruction)
          : firstStep.instruction
        : summarizeGroupedInstruction(group)
    };
  });
}

function rebuildBreakdown(collapsedSteps, route) {
  const fallbackBreakdown = Array.isArray(route.breakdown) ? route.breakdown : [];
  const summaryByMode = new Map();

  for (const step of collapsedSteps) {
    if (!summaryByMode.has(step.mode)) {
      summaryByMode.set(step.mode, {
        mode: step.mode,
        label: formatMode(step.mode),
        stepCount: 0,
        rawDistance: 0,
        rawTime: 0
      });
    }

    const entry = summaryByMode.get(step.mode);
    entry.stepCount += 1;
    entry.rawDistance += step.rawDistance || 0;
    entry.rawTime += step.rawTime || 0;
  }

  for (const fallbackEntry of fallbackBreakdown) {
    if (!summaryByMode.has(fallbackEntry.mode)) {
      summaryByMode.set(fallbackEntry.mode, {
        mode: fallbackEntry.mode,
        label: fallbackEntry.label || formatMode(fallbackEntry.mode),
        stepCount: fallbackEntry.stepCount || 0,
        rawDistance: fallbackEntry.rawDistance || 0,
        rawTime: fallbackEntry.rawTime || 0
      });
      continue;
    }

    const entry = summaryByMode.get(fallbackEntry.mode);

    if (!entry.rawDistance && fallbackEntry.rawDistance) {
      entry.rawDistance = fallbackEntry.rawDistance;
    }

    if (!entry.rawTime && fallbackEntry.rawTime) {
      entry.rawTime = fallbackEntry.rawTime;
    }
  }

  return Array.from(summaryByMode.values())
    .filter((entry) => entry.stepCount || entry.rawDistance || entry.rawTime)
    .map((entry) => ({
      ...entry,
      distance: formatDistanceMiles(entry.rawDistance || 0),
      time: formatTimeMinutes(entry.rawTime || 0)
    }));
}

function selectDominantMode(breakdown, optimization) {
  const totalDistance = breakdown.reduce((sum, entry) => sum + (entry.rawDistance || 0), 0);
  const distanceDominant = breakdown.find((entry) => totalDistance > 0 && (entry.rawDistance || 0) / totalDistance >= 0.55);

  if (distanceDominant) {
    return distanceDominant.mode;
  }

  const ranked = breakdown
    .slice()
    .sort((left, right) => {
      const primaryLeft = optimization === "fastest" ? left.rawTime || 0 : left.rawDistance || 0;
      const primaryRight = optimization === "fastest" ? right.rawTime || 0 : right.rawDistance || 0;

      if (primaryRight !== primaryLeft) {
        return primaryRight - primaryLeft;
      }

      const secondaryLeft = optimization === "fastest" ? left.rawDistance || 0 : left.rawTime || 0;
      const secondaryRight = optimization === "fastest" ? right.rawDistance || 0 : right.rawTime || 0;
      return secondaryRight - secondaryLeft;
    });

  return ranked[0]?.mode || "walk";
}

function buildExplanation(optimization, dominantMode) {
  if (optimization === "fastest") {
    return `Fastest route with mostly ${dominantMode} segments. Prioritizes lower travel time and fewer unnecessary transfers.`;
  }

  return `Shortest route with mostly ${dominantMode} segments. Keeps the path compact and easier to follow.`;
}

function normalizeCppRoute(route) {
  const collapsedSteps = collapseSteps(route.steps || []);
  const breakdown = rebuildBreakdown(collapsedSteps, route);
  const dominantMode = selectDominantMode(breakdown, route.optimization);

  return {
    ...route,
    steps: collapsedSteps.map(({ rawDistance, rawTime, ...step }) => step),
    breakdown,
    explanation: buildExplanation(route.optimization, dominantMode),
    highlights: {
      ...route.highlights,
      dominantMode,
      stepCount: collapsedSteps.length
    }
  };
}

export async function canUseCppPlanner({ modePreference = "any" } = {}) {
  if (modePreference !== "any") {
    return false;
  }

  return binaryExists(getBinaryPath());
}

export async function computeCppRoute({ start, end, optimization, modePreference = "any" }) {
  if (modePreference !== "any") {
    throw createApiError(400, "CPP_MODE_UNSUPPORTED", "The C++ adapter currently supports Any mode only.");
  }

  const startLocation = resolveLocationPayload(start, "start");
  const endLocation = resolveLocationPayload(end, "end");
  const binaryPath = getBinaryPath();

  if (!(await binaryExists(binaryPath))) {
    throw createApiError(503, "CPP_PLANNER_MISSING", "Build the C++ web adapter before using the real planner engine.");
  }

  const requestPayload = JSON.stringify({
    startLabel: startLocation.label,
    startLatitude: startLocation.latitude,
    startLongitude: startLocation.longitude,
    endLabel: endLocation.label,
    endLatitude: endLocation.latitude,
    endLongitude: endLocation.longitude,
    optimization
  });

  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, [`--data=${getDataPath()}`], {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let settled = false;
    const timeout = globalThis.setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill("SIGKILL");
      reject(createApiError(504, "CPP_PLANNER_TIMEOUT", "The C++ route planner took too long to respond."));
    }, defaultTimeoutMs);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      globalThis.clearTimeout(timeout);
      reject(createApiError(502, "CPP_PLANNER_FAILED", error.message));
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      globalThis.clearTimeout(timeout);

      if (code !== 0) {
        reject(normalizeAdapterError(stderr, stdout));
        return;
      }

      try {
        const route = JSON.parse(stdout);
        resolve(normalizeCppRoute(route));
      } catch {
        reject(createApiError(502, "CPP_PLANNER_FAILED", "The C++ route planner returned malformed JSON."));
      }
    });

    child.stdin.write(requestPayload);
    child.stdin.end();
  });
}
