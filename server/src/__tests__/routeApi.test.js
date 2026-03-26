import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const app = createApp();

describe("RouteHacker API", () => {
  it("returns a route payload for a valid request", async () => {
    const response = await request(app).post("/api/route").send({
      start: "aggie_works",
      end: "west_village",
      optimization: "shortest"
    });

    expect(response.status).toBe(200);
    expect(response.body.summary).toContain("AggieWorks Studio");
    expect(response.body.steps.length).toBeGreaterThan(0);
  });

  it("produces different shortest and fastest routes", async () => {
    const shortest = await request(app).post("/api/route").send({
      start: "aggie_works",
      end: "west_village",
      optimization: "shortest"
    });
    const fastest = await request(app).post("/api/route").send({
      start: "aggie_works",
      end: "west_village",
      optimization: "fastest"
    });

    expect(shortest.status).toBe(200);
    expect(fastest.status).toBe(200);
    expect(shortest.body.totals.distance).not.toBe(fastest.body.totals.distance);
    expect(shortest.body.totals.time).not.toBe(fastest.body.totals.time);
  });

  it("filters routes to a requested transportation mode", async () => {
    const response = await request(app).post("/api/route").send({
      start: "aggie_works",
      end: "west_village",
      optimization: "fastest",
      modePreference: "shuttle"
    });

    expect(response.status).toBe(200);
    expect(response.body.modePreference).toBe("shuttle");
    expect(response.body.steps.every((step) => step.mode === "shuttle")).toBe(true);
  });

  it("rejects invalid locations", async () => {
    const response = await request(app).post("/api/route").send({
      start: "unknown",
      end: "west_village",
      optimization: "shortest"
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_LOCATION");
  });

  it("rejects an invalid mode preference", async () => {
    const response = await request(app).post("/api/route").send({
      start: "aggie_works",
      end: "west_village",
      optimization: "shortest",
      modePreference: "car"
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_MODE_PREFERENCE");
  });

  it("rejects same start and end", async () => {
    const response = await request(app).post("/api/route").send({
      start: "aggie_works",
      end: "aggie_works",
      optimization: "fastest"
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("SAME_LOCATION");
  });

  it("returns not found for disconnected nodes", async () => {
    const response = await request(app).post("/api/route").send({
      start: "aggie_works",
      end: "research_park",
      optimization: "fastest"
    });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });

  it("returns not found when no route exists for the chosen transportation mode", async () => {
    const response = await request(app).post("/api/route").send({
      start: "aggie_works",
      end: "west_village",
      optimization: "fastest",
      modePreference: "bike"
    });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
