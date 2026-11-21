import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import LogoMark from "@/components/brand/LogoMark";
import { DOTS, DROP_D, LEAF_D } from "@/components/brand/logoMarkPaths";

const dir = resolve(__dirname, "../components/brand");
const css = readFileSync(resolve(dir, "logo-mark.css"), "utf8");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const svgOf = (c: HTMLElement) => c.querySelector("svg") as SVGSVGElement;

describe("LogoMark structure", () => {
  it("renders the drop, the leaf and five official dots in order", () => {
    const { container } = render(<LogoMark />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0].getAttribute("d")).toBe(DROP_D);
    expect(paths[0].getAttribute("fill")).toBe("#013629");
    expect(paths[1].getAttribute("d")).toBe(LEAF_D);
    const circles = Array.from(container.querySelectorAll("circle"));
    expect(circles.map((c) => c.getAttribute("fill"))).toEqual([
      "#8C6A8F",
      "#739371",
      "#BB532B",
      "#CE9B60",
      "#5F86A8",
    ]);
    expect(DOTS).toHaveLength(5);
  });

  it("maps state to data-logo-state and thinking class", () => {
    const { container, rerender } = render(<LogoMark state="idle" breathe />);
    expect(svgOf(container).getAttribute("data-logo-state")).toBe("idle");
    expect(svgOf(container).classList.contains("seeld-lm--breathe")).toBe(true);
    rerender(<LogoMark state="listening" />);
    expect(svgOf(container).getAttribute("data-logo-state")).toBe("listening");
    rerender(<LogoMark state="speaking" />);
    expect(svgOf(container).getAttribute("data-logo-state")).toBe("speaking");
    rerender(<LogoMark state="thinking" />);
    expect(svgOf(container).classList.contains("is-thinking")).toBe(true);
    expect(svgOf(container).getAttribute("aria-busy")).toBe("true");
  });

  it("handles label and aria", () => {
    const a = render(<LogoMark label="x" />);
    expect(svgOf(a.container).getAttribute("role")).toBe("img");
    expect(svgOf(a.container).getAttribute("aria-label")).toBe("x");
    expect(svgOf(a.container).getAttribute("aria-hidden")).toBeNull();
    a.unmount();
    const b = render(<LogoMark />);
    expect(svgOf(b.container).getAttribute("aria-hidden")).toBe("true");
    expect(svgOf(b.container).getAttribute("focusable")).toBe("false");
    expect(svgOf(b.container).getAttribute("role")).toBeNull();
  });

  it("adds the instant modifier, size and extra class", () => {
    const { container } = render(<LogoMark instant size="20px" className="foo" state="thinking" />);
    const s = svgOf(container);
    expect(s.classList.contains("seeld-lm--instant")).toBe(true);
    expect(s.classList.contains("foo")).toBe(true);
    expect(s.classList.contains("is-thinking")).toBe(true);
    expect(s.style.getPropertyValue("--lg-size")).toBe("20px");
  });
});

describe("settle hook", () => {
  it("removes thinking, adds is-settling, then clears", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<LogoMark state="thinking" />);
    const s = svgOf(container);
    expect(s.classList.contains("is-thinking")).toBe(true);
    rerender(<LogoMark state="idle" />);
    expect(s.classList.contains("is-thinking")).toBe(false);
    expect(s.classList.contains("is-settling")).toBe(true);
    const spin = s.querySelector(".seeld-lm-spin") as SVGElement;
    expect(spin.style.transition).toContain("900ms");
    vi.advanceTimersByTime(1000);
    expect(s.classList.contains("is-settling")).toBe(false);
    expect(spin.style.transition).toBe("");
  });

  it("cleans its timer on unmount", () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(<LogoMark state="thinking" />);
    rerender(<LogoMark state="idle" />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("css and sources", () => {
  it("has the reduced-motion block and every keyframe", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    for (const k of ["spin", "hop", "pulse", "sway", "breathe", "fade", "listen", "speak"]) {
      expect(css).toContain(`@keyframes seeld-lm-${k}`);
    }
    expect(css).toContain(".seeld-lm--instant");
    expect(css).toContain("--lg-dur");
  });

  it("has no Hebrew text and no forbidden words", () => {
    const files = ["LogoMark.tsx", "logoMarkPaths.ts", "logo-mark.css"].map((f) =>
      readFileSync(resolve(dir, f), "utf8"),
    );
    for (const src of files) {
      expect(src).not.toMatch(/[\u0590-\u05FF]/);
      expect(src).not.toMatch(/תאגיד|בחינם|ללא עלות/);
    }
  });
});
