import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ComingSoon from "@/pages/ComingSoon";

const ROOT = join(__dirname, "..", "..");
const APP = readFileSync(join(ROOT, "src", "App.tsx"), "utf8");

afterEach(() => vi.unstubAllGlobals());

describe("v2 holding screen", () => {
  it("renders the calm 'בקרוב' screen with both department contacts and makes no request", () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    render(<MemoryRouter><ComingSoon /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/בקרוב/);
    expect(screen.getByRole("region", { name: "ביטוח" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "פיננסים וכללי" })).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it("has a form variant for the id / bank-details flows", () => {
    render(<MemoryRouter><ComingSoon variant="form" /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/הטופס הדיגיטלי/);
  });
});

describe("App routes", () => {
  it("in v2, the staff / personal areas resolve to the holding screen", () => {
    const v2 = APP.slice(APP.indexOf("{IS_V2 ? ("), APP.indexOf(") : (", APP.indexOf("{IS_V2 ? (")));
    for (const p of ["/q/:token", "/portal/*", "/execution-portal/*", "/client/*", "/app/*", "/app"]) {
      expect(v2).toContain(`<Route path="${p}" element={<ComingSoon />} />`);
    }
    for (const el of ["SiteAdmin />", "DirectDebit />, \"form\"", "SavedCalculations />", "PersonalArea />"]) {
      expect(APP).toContain(`hold(<${el})`);
    }
    // /onboarding is the joining entry of the POA wizard, never the old form (owner decision 2026-11-22)
    expect(APP).toContain('<Route path="/onboarding" element={<Navigate to={`${POA_ROUTE}?from=join`} replace />} />');
    expect(APP).not.toContain('import("@/pages/Onboarding")');
  });

  it("the page-view log is legacy-only and the PDage module is gone from the router", () => {
    expect(APP).toContain("{!IS_V2 && <PageViewTracker />}");
    expect(APP.toLowerCase()).not.toContain("pdage");
  });
});
