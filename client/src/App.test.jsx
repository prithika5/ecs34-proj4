import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RouteHacker app", () => {
  it("renders the route form", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Choose a start, destination, and route mode/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /See best route/i })).toBeInTheDocument();
  });

  it("validates same start and end before calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<App />);

    fireEvent.change(screen.getByLabelText("End"), { target: { value: "aggie_works" } });
    fireEvent.click(screen.getByRole("button", { name: /See best route/i }));

    expect(await screen.findByText(/Start and end need to be different/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows loading and renders results after a successful API response", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (success) => success({ coords: { latitude: 38.544, longitude: -121.740 } })
      }
    });

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: "AggieWorks Studio to West Village",
          optimization: "shortest",
          totals: { distance: "2.50 mi", time: "18 min", rawDistance: 2.5, rawTime: 18 },
          explanation: "Shortest mode leans on walk segments.",
          highlights: { dominantMode: "walk", stepCount: 3, tradeoffLabel: "Cuts distance", campusFeel: "Walk-heavy." },
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: "AggieWorks Studio to West Village",
          optimization: "fastest",
          totals: { distance: "2.95 mi", time: "10 min", rawDistance: 2.95, rawTime: 10 },
          explanation: "Fastest mode leans on shuttle segments.",
          highlights: { dominantMode: "shuttle", stepCount: 2, tradeoffLabel: "Saves time", campusFeel: "Shuttle-heavy." },
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
      });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /See best route/i }));

    expect(screen.getByText(/Checking the best path now/i)).toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: /AggieWorks Studio to West Village/i })).toBeInTheDocument();
    expect(screen.getByText(/Shortest mode leans on walk segments/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare modes/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Start navigation/i }));
    expect(screen.getByText(/Guided navigation is active/i)).toBeInTheDocument();
    expect(screen.getByText(/Location ready near/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Finish|Next step/i }));
  });

  it("renders API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "No connected route exists for the requested locations." }
      })
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /See best route/i }));

    await waitFor(() => {
      expect(screen.getByText(/No connected route exists/i)).toBeInTheDocument();
    });
  });
});
