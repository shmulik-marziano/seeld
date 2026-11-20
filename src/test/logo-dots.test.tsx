import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import LogoDots from "@/components/brand/LogoDots";
import RouteTransitionDots from "@/components/RouteTransitionDots";
import { FADE_MS, MIN_SHOW_MS } from "@/lib/flags/logoDots";

const ROOT = join(__dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const APP = read("src", "App.tsx");

const realMatchMedia = window.matchMedia;
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.matchMedia = realMatchMedia;
  Object.defineProperty(navigator, "webdriver", { configurable: true, get: () => false });
});

function Go({ to, replace = false, label = "go" }: { to: string; replace?: boolean; label?: string }) {
  const nav = useNavigate();
  return <button onClick={() => nav(to, { replace })}>{label}</button>;
}
const harness = (to = "/b", replace = false) =>
  render(
    <MemoryRouter initialEntries={["/a"]}>
      <Go to={to} replace={replace} />
      <Go to="/c" label="go-c" />
      <Go to="/a#x" label="go-hash" />
      <Go to="/a?q=1" label="go-search" />
      <Routes><Route path="*" element={<p>page</p>} /></Routes>
      <RouteTransitionDots />
    </MemoryRouter>,
  );
const overlay = () => document.querySelector("[data-seeld-dots-overlay]");
const click = (name = "go") => fireEvent.click(screen.getByRole("button", { name }));
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("logo-dots switch (build time)", () => {
  const load = async () => {
    vi.resetModules();
    return (await vi.importActual<typeof import("@/lib/flags/logoDots")>("@/lib/flags/logoDots")).LOGO_DOTS_TRANSITION;
  };
  it("is on when VITE_LOGO_DOTS is unset", async () => {
    vi.stubEnv("VITE_LOGO_DOTS", undefined as unknown as string);
    expect(await load()).toBe(true);
  });
  it("is on for any value other than off", async () => {
    vi.stubEnv("VITE_LOGO_DOTS", "on");
    expect(await load()).toBe(true);
  });
  it("is off only with VITE_LOGO_DOTS=off", async () => {
    vi.stubEnv("VITE_LOGO_DOTS", "off");
    expect(await load()).toBe(false);
  });
  it("timing constants", () => {
    expect(MIN_SHOW_MS).toBe(500);
    expect(FADE_MS).toBe(180);
  });
});

describe("LogoDots", () => {
  it("renders exactly the five logo dots with the exact centres, fills and r=35, matching the logo file", () => {
    const { container } = render(<LogoDots />);
    const circles = [...container.querySelectorAll("circle")];
    expect(circles).toHaveLength(5);
    const got = circles.map((c) => [Number(c.getAttribute("cx")), Number(c.getAttribute("cy")), c.getAttribute("r"), c.getAttribute("fill")]);
    expect(got).toEqual([
      [146.4, 177.5, "35", "#8C6A8F"],
      [210.5, 113.4, "35", "#739371"],
      [298, 90, "35", "#BB532B"],
      [385.5, 113.4, "35", "#CE9B60"],
      [449.6, 177.5, "35", "#5F86A8"],
    ]);
    const svgSrc = read("public", "brand", "logo-icon.svg");
    const logo = [...svgSrc.matchAll(/<circle[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"[^>]*r="([\d.]+)"[^>]*fill="(#[0-9A-Fa-f]{6})"/g)]
      .map((m) => [Number(m[1]), Number(m[2]), m[3], m[4]]);
    expect(logo).toEqual(got);
    circles.forEach((c, i) => {
      expect(c).toHaveClass("seeld-dot");
      expect(c.style.getPropertyValue("--i")).toBe(String(i));
    });
  });
  it("is decorative and not focusable; no text", () => {
    const { container } = render(<LogoDots />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg.textContent).toBe("");
    expect(container.querySelector("path, text, image")).toBeNull();
  });
  it("animated by default; animated=false gives still dots; size sets the width", () => {
    const a = render(<LogoDots />).container.querySelector("svg")!;
    expect(a).toHaveClass("seeld-dots", "seeld-dots--anim");
    const b = render(<LogoDots animated={false} size="120px" className="x" />).container.querySelector("svg")!;
    expect(b).not.toHaveClass("seeld-dots--anim");
    expect(b).not.toHaveClass("seeld-dots--static");
    expect(b).toHaveClass("x");
    expect(b.style.width).toBe("120px");
  });
  it("prefers-reduced-motion yields the static (opacity-only) class", () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    const svg = render(<LogoDots />).container.querySelector("svg")!;
    expect(svg).toHaveClass("seeld-dots--static");
    expect(svg).not.toHaveClass("seeld-dots--anim");
  });
  it("the CSS has a reduced-motion block with no movement, and the static class only fades", () => {
    const css = read("src", "components", "brand", "logo-dots.css");
    const reduce = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduce).toContain(".seeld-dots--anim .seeld-dot");
    expect(reduce).toContain("seeld-dot-breathe");
    expect(reduce).toContain("transform: none");
    const breathe = /@keyframes seeld-dot-breathe\s*\{([^@]*?)\n\}/.exec(css)?.[1] ?? "";
    expect(breathe).toContain("opacity");
    expect(breathe).not.toContain("transform");
    expect(css).toMatch(/\.seeld-dots--static \.seeld-dot \{\s*animation: seeld-dot-breathe/);
    const overlayRule = /\.seeld-dots-overlay \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(overlayRule).toContain(`transition: opacity ${FADE_MS}ms`);
    expect(css).toMatch(/\.seeld-dots-overlay \{[^}]*z-index: 90;[^}]*background: #FCF8EF;/);
  });
});

describe("RouteTransitionDots overlay", () => {
  it("renders nothing on first mount", () => {
    vi.useFakeTimers();
    harness();
    expect(overlay()).toBeNull();
    tick(5000);
    expect(overlay()).toBeNull();
  });

  it("shows after a pathname change, stays MIN_SHOW_MS, fades FADE_MS, then unmounts", () => {
    vi.useFakeTimers();
    harness();
    click();
    const o = overlay();
    expect(o).not.toBeNull();
    expect(screen.getByRole("status", { name: "העמוד נטען" })).toBe(o);
    expect(o).toHaveAttribute("aria-live", "polite");
    expect(o).toHaveAttribute("data-prerender-skip", "");
    expect(o!.querySelectorAll("circle")).toHaveLength(5);
    expect(o!.textContent).toBe("");
    expect(o!.querySelector("a, button, input, [tabindex]")).toBeNull();
    expect(document.activeElement).not.toBe(o);
    tick(MIN_SHOW_MS - 1);
    expect(overlay()).not.toHaveAttribute("data-leaving");
    tick(1);
    expect(overlay()).toHaveAttribute("data-leaving");
    tick(FADE_MS - 1);
    expect(overlay()).not.toBeNull();
    tick(1);
    expect(overlay()).toBeNull();
  });

  it("rapid double navigation restarts the cycle and never leaves it stuck", () => {
    vi.useFakeTimers();
    harness();
    click();
    tick(300);
    click("go-c");
    tick(300); // 600ms after the first click, 300ms after the second
    expect(overlay()).not.toBeNull();
    expect(overlay()).not.toHaveAttribute("data-leaving");
    tick(200);
    expect(overlay()).toHaveAttribute("data-leaving");
    tick(FADE_MS);
    expect(overlay()).toBeNull();
    tick(5000);
    expect(overlay()).toBeNull();
  });

  it("a navigation during the fade shows it again", () => {
    vi.useFakeTimers();
    harness();
    click();
    tick(MIN_SHOW_MS + 50);
    expect(overlay()).toHaveAttribute("data-leaving");
    click("go-c");
    expect(overlay()).not.toHaveAttribute("data-leaving");
    tick(MIN_SHOW_MS + FADE_MS);
    expect(overlay()).toBeNull();
  });

  it("ignores REPLACE navigations (redirects)", () => {
    vi.useFakeTimers();
    harness("/b", true);
    click();
    expect(overlay()).toBeNull();
  });

  it("ignores hash-only changes on the same page", () => {
    vi.useFakeTimers();
    harness();
    click("go-hash");
    expect(overlay()).toBeNull();
  });

  it("ignores search-only changes on the same page", () => {
    vi.useFakeTimers();
    harness();
    click("go-search");
    tick(MIN_SHOW_MS);
    expect(overlay()).toBeNull();
  });

  it("never renders under automation (prerender / Playwright)", () => {
    Object.defineProperty(navigator, "webdriver", { configurable: true, get: () => true });
    vi.useFakeTimers();
    harness();
    click();
    expect(overlay()).toBeNull();
  });

  it("unmounting mid-cycle clears its timers", () => {
    vi.useFakeTimers();
    const r = harness();
    click();
    r.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("App wiring", () => {
  it("imports the switch and the overlay and guards the element with the switch", () => {
    expect(APP).toContain('import RouteTransitionDots from "@/components/RouteTransitionDots";');
    expect(APP).toContain('import { LOGO_DOTS_TRANSITION } from "@/lib/flags/logoDots";');
    expect(APP.match(/<RouteTransitionDots \/>/g)).toHaveLength(1);
    expect(APP).toContain("{LOGO_DOTS_TRANSITION && <RouteTransitionDots />}");
  });
  it("sits inside BrowserRouter, next to ScrollToTop, outside Suspense and PageTransition", () => {
    const at = APP.indexOf("<RouteTransitionDots />");
    expect(at).toBeGreaterThan(APP.indexOf("<BrowserRouter>"));
    expect(at).toBeGreaterThan(APP.indexOf("<ScrollToTop />"));
    expect(at).toBeLessThan(APP.indexOf("<Suspense fallback={<RouteFallback />}>"));
    expect(at).toBeLessThan(APP.indexOf("</BrowserRouter>"));
  });
});

describe("logo-dots copy rules", () => {
  const HE = "\\u0590-\\u05FFA-Za-z";
  const AEO_SRC = read("scripts", "check-aeo.mjs");
  const NAME_SRC = /const NAME_RE = new RegExp\(`(.*)`, "u"\)/.exec(AEO_SRC)?.[1];
  const NAME_RE = new RegExp((NAME_SRC ?? "(?!)").split("${HE}").join(HE), "u");
  const FORBIDDEN: [string, RegExp][] = [
    ["תאגיד", /תאגיד/u],
    ["free", /ללא עלות|בחינם/u],
    ["promise", /מובטח|מבטיח/u],
    ["superlative", /ביותר/u],
    ["gendered suffix", /[֐-׿]\/[֐-׿]/u],
    ["licence text", /רישיון מס|מס' רישיון|מספר רישיון/u],
    ["non-neutral loading form", /טוען/u],
    ["emoji", /\p{Extended_Pictographic}/u],
    ["names", NAME_RE],
  ];
  const fallback = read("src", "components", "RouteFallback.tsx").replace(/\r\n/g, "\n");
  // Only the switch-on branch of RouteFallback is new copy; the switch-off branch is today's loader, unchanged.
  const onAt = fallback.indexOf("if (LOGO_DOTS_TRANSITION)");
  const fallbackOn = fallback.slice(onAt, fallback.indexOf("\n  }\n", onAt));
  const RAW = [
    read("src", "lib", "flags", "logoDots.ts"),
    read("src", "components", "brand", "LogoDots.tsx"),
    read("src", "components", "brand", "logo-dots.css"),
    read("src", "components", "RouteTransitionDots.tsx"),
    fallbackOn,
  ].join("\n");

  it("the name deny-list was found", () => expect(NAME_SRC).toBeTruthy());
  it.each(FORBIDDEN)("no %s in the new sources", (_n, re) => expect(RAW).not.toMatch(re));
  it("the only Hebrew string is the neutral label", () => {
    expect(RAW.match(/[֐-׿][֐-׿ ]*[֐-׿]/gu)).toEqual(["העמוד נטען", "העמוד נטען"]);
  });
});
