import cors from "cors";
import express from "express";
import { routeRouter } from "./routes/routeRouter.js";
import { createApiError } from "./lib/errors.js";

function getCorsOptions() {
  const configuredOrigins = process.env.CLIENT_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!configuredOrigins || configuredOrigins.length === 0) {
    return {};
  }

  return {
    origin: configuredOrigins
  };
}

export function createApp() {
  const app = express();

  app.use(cors(getCorsOptions()));
  app.use(express.json());

  app.use("/api", routeRouter);

  app.use((_request, _response, next) => {
    next(createApiError(404, "NOT_FOUND", "The requested resource does not exist."));
  });

  app.use((error, _request, response, _next) => {
    if (error?.status && error?.body) {
      return response.status(error.status).json(error.body);
    }

    return response.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "RouteHacker hit an unexpected error."
      }
    });
  });

  return app;
}
