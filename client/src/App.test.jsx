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
    expect(screen.getByText(/Deterministic routing with startup-grade presentation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hack the route/i })).toBeInTheDocument();
  });

  it("validates same start and end before calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<App />);

    fireEvent.change(screen.getByLabelText("End"), { target: { value: "aggie_works" } });
    fireEvent.click(screen.getByRole("button", { name: /Hack the route/i }));

    expect(await screen.findByText(/Start and end need to be different/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows loading and renders results after a successful API response", async () => {
    let resolveFetch;
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Hack the route/i }));

    expect(screen.getByText(/Crunching graph weights/i)).toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => ({
        summary: "AggieWorks Studio to West Village",
        optimization: "fastest",
        totals: { distance: "2.95 mi", time: "10 min" },
        explanation: "Fastest mode leans on shuttle segments.",
        steps: [{ index: 1, instruction: "Take the shuttle.", mode: "shuttle", distance: "1.20 mi", time: "4 min" }]
      })
    });
    expect(await screen.findByText(/AggieWorks Studio to West Village/i)).toBeInTheDocument();
    expect(screen.getByText(/Fastest mode leans on shuttle segments/i)).toBeInTheDocument();
  });

  it("renders API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "No connected route exists for the requested locations." }
      })
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Hack the route/i }));

    await waitFor(() => {
      expect(screen.getByText(/No connected route exists/i)).toBeInTheDocument();
    });
  });
});
