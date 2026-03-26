import { Router } from "express";
import { computeRoute } from "../services/routeService.js";
import { createApiError } from "../lib/errors.js";

export const routeRouter = Router();

routeRouter.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "routehacker-api"
  });
});

routeRouter.post("/route", (request, response, next) => {
  const { start, end, optimization, modePreference } = request.body ?? {};

  if (!start || !end || !optimization) {
    return next(
      createApiError(400, "INVALID_REQUEST", "start, end, and optimization are required.", {
        required: ["start", "end", "optimization"]
      })
    );
  }

  try {
    const route = computeRoute({ start, end, optimization, modePreference });
    return response.json(route);
  } catch (error) {
    return next(error);
  }
});
