import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RouteHacker app", () => {
  it("renders the floating planner shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Find a Davis trip/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Start")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get route/i })).toBeInTheDocument();
  });

  it("validates same start and destination before calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<App />);

    fireEvent.focus(screen.getByLabelText("Destination"));
    fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "Aggie" } });
    fireEvent.click(screen.getByRole("button", { name: /AggieWorks Studio/i }));
    fireEvent.click(screen.getByRole("button", { name: /Get route/i }));

    expect(await screen.findByText(/Start and destination need to be different/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders the trip cards after a successful route request", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
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
          explanation: "Fastest mode leans on shuttle segments.",
          highlights: { dominantMode: "shuttle", stepCount: 2, tradeoffLabel: "Saves time" },
          breakdown: [{ mode: "shuttle", label: "Shuttle", stepCount: 2, distance: "2.95 mi", time: "10 min" }],
          steps: [
            {
              index: 1,
              instruction: "Take the campus shuttle express from AggieWorks Studio to Silo Transit Terminal.",
              mode: "shuttle",
              distance: "1.20 mi",
              time: "4 min"
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: "AggieWorks Studio to West Village",
          engine: "cpp",
          optimization: "shortest",
          totals: { distance: "2.50 mi", time: "18 min", rawDistance: 2.5, rawTime: 18 },
          geometry: {
            type: "LineString",
            coordinates: [
              [-121.7407, 38.5445],
              [-121.7498, 38.5423],
              [-121.7718, 38.5442]
            ]
          },
          explanation: "Shortest mode leans on walk segments.",
          highlights: { dominantMode: "walk", stepCount: 3, tradeoffLabel: "Cuts distance" },
          breakdown: [{ mode: "walk", label: "Walk", stepCount: 3, distance: "2.50 mi", time: "18 min" }],
          steps: [
            {
              index: 1,
              instruction: "Take the pedestrian spine from AggieWorks Studio to Memorial Union.",
              mode: "walk",
              distance: "0.60 mi",
              time: "12 min"
            }
          ]
        })
      });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Get route/i }));

    expect(screen.getByText(/Computing the best path/i)).toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "10 min" })).toBeInTheDocument();
    expect(screen.getByText(/Mode breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Real C\+\+ route/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare modes/i)).toBeInTheDocument();
    expect(screen.getByText(/Fastest mode leans on shuttle segments/i)).toBeInTheDocument();
  });

  it("renders API errors in the trip panel", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "No connected route exists for the requested locations." }
      })
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Get route/i }));

    await waitFor(() => {
      expect(screen.getByText(/No connected route exists/i)).toBeInTheDocument();
    });
  });
});
