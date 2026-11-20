import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import RouteFallback from "@/components/RouteFallback";
import RouteTransitionDots from "@/components/RouteTransitionDots";

// Components read LOGO_DOTS_TRANSITION at render time; a getter lets each test flip it (same pattern as poa-flag).
const flag = vi.hoisted(() => ({ on: true }));
vi.mock("@/lib/flags/logoDots", async (orig) => {
  const m = await orig<typeof import("@/lib/flags/logoDots")>();
  return { ...m, get LOGO_DOTS_TRANSITION() { return flag.on; } };
});

afterEach(() => { flag.on = true; });

function Go() {
  const nav = useNavigate();
  return <button onClick={() => nav("/b")}>go</button>;
}

describe("RouteFallback", () => {
  it("switch on: the five logo dots on the cream canvas, neutral label, no PNG, no bar", () => {
    const { container } = render(<RouteFallback />);
    const status = screen.getByRole("status", { name: "העמוד נטען" });
    expect(status).toHaveClass("bg-[#FCF8EF]");
    expect(status.querySelectorAll("circle")).toHaveLength(5);
    expect(status.querySelector("svg")).toHaveClass("seeld-dots--anim");
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
