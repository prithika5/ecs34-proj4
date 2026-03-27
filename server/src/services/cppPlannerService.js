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

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(createApiError(502, "CPP_PLANNER_FAILED", error.message));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(normalizeAdapterError(stderr, stdout));
        return;
      }

      try {
        const route = JSON.parse(stdout);
        resolve(route);
      } catch {
        reject(createApiError(502, "CPP_PLANNER_FAILED", "The C++ route planner returned malformed JSON."));
      }
    });

    child.stdin.write(requestPayload);
    child.stdin.end();
  });
}
