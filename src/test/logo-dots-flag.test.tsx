import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import RouteFallback from "@/components/RouteFallback";
import { dotsClock } from "@/lib/flags/logoDots";
import RouteTransitionDots from "@/components/RouteTransitionDots";

// Components read LOGO_DOTS_TRANSITION at render time; a getter lets each test flip it (same pattern as poa-flag).
const flag = vi.hoisted(() => ({ on: true }));
vi.mock("@/lib/flags/logoDots", async (orig) => {
  const m = await orig<typeof import("@/lib/flags/logoDots")>();
  return { ...m, get LOGO_DOTS_TRANSITION() { return flag.on; } };
});

const mark = vi.hoisted(() => ({ on: true }));
vi.mock("@/lib/flags/liveMark", () => ({
  get LIVE_MARK() { return mark.on; },
}));

afterEach(() => { flag.on = true; mark.on = true; });

function Go() {
  const nav = useNavigate();
  return <button onClick={() => nav("/b")}>go</button>;
}

describe("RouteFallback", () => {
  it("switch on, live mark on: the mark (thinking, instant) on the cream canvas, neutral label, no PNG, no bar, no dots", async () => {
    const { container } = render(<RouteFallback />);
    const status = screen.getByRole("status", { name: "העמוד נטען" });
    expect(status).toHaveClass("bg-[#FCF8EF]");
    await waitFor(() => expect(status.querySelectorAll("svg")).toHaveLength(1));
    const svgs = status.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toHaveClass("seeld-lm", "seeld-lm--instant");
    expect(svgs[0]).toHaveAttribute("data-logo-state", "thinking");
    expect(container.querySelector(".seeld-dots")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".seeld-route-bar")).toBeNull();
    expect(status.textContent).toBe("");
  });
  it("aligns the mark to the overlay clock (--lg-phase) when an overlay started earlier", async () => {
    dotsClock.t0 = performance.now() - 1000;
    render(<RouteFallback />);
    const status = screen.getByRole("status", { name: "העמוד נטען" });
    await waitFor(() => expect(status.querySelector("svg")).not.toBeNull());
    const phase = parseInt(status.querySelector("svg")!.style.getPropertyValue("--lg-phase"), 10);
    expect(phase).toBeGreaterThanOrEqual(1000);
    expect(phase).toBeLessThan(3600);
    dotsClock.t0 = 0;
  });
  it("switch on, live mark off: the five logo dots on the cream canvas, no PNG, no bar", () => {
    mark.on = false;
    const { container } = render(<RouteFallback />);
    const status = screen.getByRole("status", { name: "העמוד נטען" });
    expect(status).toHaveClass("bg-[#FCF8EF]");
    expect(status.querySelectorAll("circle")).toHaveLength(5);
    expect(status.querySelector("svg")).toHaveClass("seeld-dots--anim");
    expect(container.querySelector(".seeld-lm")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".seeld-route-bar")).toBeNull();
    expect(status.textContent).toBe("");
  });
  it("switch off: today's loader exactly (PNG mark, top bar, previous label)", () => {
    flag.on = false;
    const { container } = render(<RouteFallback />);
    expect(screen.getByRole("status", { name: "טוען עמוד" })).toBeInTheDocument();
    expect(container.querySelector('img[src="/brand/logo-icon-96.png"]')).not.toBeNull();
    expect(container.querySelector(".seeld-route-bar")).not.toBeNull();
    expect(container.querySelector("circle")).toBeNull();
  });
});

describe("RouteTransitionDots with the switch off", () => {
  it("renders nothing even after a navigation", () => {
    flag.on = false;
    render(
      <MemoryRouter initialEntries={["/a"]}>
        <Go />
        <Routes><Route path="*" element={<p>page</p>} /></Routes>
        <RouteTransitionDots />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    expect(document.querySelector("[data-seeld-dots-overlay]")).toBeNull();
  });
});

describe("live-mark switch (build time)", () => {
  const load = async () => {
    vi.resetModules();
    return (await vi.importActual<typeof import("@/lib/flags/liveMark")>("@/lib/flags/liveMark")).LIVE_MARK;
  };
  afterEach(() => { vi.unstubAllEnvs(); });
  it("is on when unset or any value other than off", async () => {
    vi.stubEnv("VITE_LIVE_MARK", undefined as unknown as string);
    expect(await load()).toBe(true);
    vi.stubEnv("VITE_LIVE_MARK", "on");
    expect(await load()).toBe(true);
  });
  it("is off only with VITE_LIVE_MARK=off", async () => {
    vi.stubEnv("VITE_LIVE_MARK", "off");
    expect(await load()).toBe(false);
  });
});
