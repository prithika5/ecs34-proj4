import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RouteHacker app", () => {
  it("renders the planner shell", () => {
    render(<App />);

    expect(screen.getByText("RouteHacker")).toBeInTheDocument();
    expect(screen.getByLabelText("Start")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get Route/i })).toBeInTheDocument();
  });

  it("validates same start and destination before calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<App />);

    fireEvent.focus(screen.getByLabelText("Destination"));
    fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "Aggie" } });
    fireEvent.click(screen.getByRole("button", { name: /AggieWorks Studio/i }));
    fireEvent.click(screen.getByRole("button", { name: /Get Route/i }));

    expect(await screen.findByText(/Start and destination must be different/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders trip summary and steps after a successful route request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        summary: "AggieWorks Studio to West Village",
        engine: "cpp",
        optimization: "fastest",
        totals: { distance: "2.95 mi", time: "10 min", rawDistance: 2.95, rawTime: 10 },
        geometry: {
          type: "LineString",
          coordinates: [
            [-121.7407, 38.5445],
            [-121.7597, 38.5382],
            [-121.7718, 38.5442]
          ]
        },
        breakdown: [{ mode: "shuttle", label: "Shuttle", stepCount: 2, distance: "2.95 mi", time: "10 min" }],
        steps: [
          {
            index: 1,
            instruction: "Shuttle via Campus shuttle express from AggieWorks Studio to Silo Transit Terminal.",
            mode: "shuttle",
            distance: "1.20 mi",
            time: "4 min"
          }
        ]
      })
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Get Route/i }));

    expect(screen.getAllByText(/Loading route/i).length).toBeGreaterThan(0);

    expect(await screen.findByRole("heading", { name: /AggieWorks Studio to West Village/i })).toBeInTheDocument();
    expect(screen.getByText("10 min")).toBeInTheDocument();
    expect(screen.getByText("2.95 mi")).toBeInTheDocument();
    expect(screen.getAllByText("Shuttle").length).toBeGreaterThan(0);
    expect(screen.getByText(/Campus shuttle express/i)).toBeInTheDocument();
  });

  it("renders API errors in the results panel", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "No connected route exists for the requested locations." }
      })
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Get Route/i }));

    await waitFor(() => {
      expect(screen.getByText(/No connected route exists/i)).toBeInTheDocument();
    });
  });
});
