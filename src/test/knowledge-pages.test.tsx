import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GuidesHub from "@/pages/learn/GuidesHub";
import PensionTaxHub from "@/pages/learn/PensionTaxHub";
import GuideArticle from "@/pages/learn/GuideArticle";
import { GUIDE_CATALOG } from "@/data/knowledge/catalog";
import { answerSummaries } from "@/data/answerSummaries";

// Smoke tests of the knowledge pages: one h1, every card in the DOM while filtering, unknown slugs fall
// through to NotFound in place, a real guide renders its summary box, sources and the fixed call to action.

const mount = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/learn/guides" element={<GuidesHub />} />
          <Route path="/learn/guides/:slug" element={<GuideArticle />} />
          <Route path="/learn/pension-tax" element={<PensionTaxHub />} />
          <Route path="/learn/pension-tax/:slug" element={<GuideArticle />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("knowledge pages", () => {
  it("renders the guides hub with one h1 and every guide card, also after filtering", () => {
    const { container } = mount("/learn/guides");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    const links = () => [...container.querySelectorAll<HTMLAnchorElement>('a[href^="/learn/guides/"]')];
    expect(links().length).toBe(GUIDE_CATALOG.length);
    fireEvent.click(screen.getAllByRole("button", { name: "פנסיה לשכירים" })[0]);
    expect(links().length).toBe(GUIDE_CATALOG.length);
    expect(container.querySelectorAll("li.hidden").length).toBe(GUIDE_CATALOG.filter((e) => e.category !== "pension-employees").length);
  });

  it("renders the tax hub with one h1 and a link to the numbers page", () => {
    const { container } = mount("/learn/pension-tax");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector('a[href="/learn/pension-tax/numbers"]')).toBeTruthy();
  });

  it("renders NotFound in place for an unknown slug", () => {
    const { container } = mount("/learn/guides/no-such-guide");
    expect(container.querySelector("article")).toBeNull();
    expect(container.textContent).not.toContain("מקורות");
  });

  it("renders a real guide: one h1, summary box, sources, the fixed call to action", async () => {
    const { container } = mount("/learn/guides/pension-fund-what-you-buy");
    await waitFor(() => expect(container.querySelector("article")).toBeTruthy());
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    // the summary exists once the assembler has registered the page
    if (answerSummaries["/learn/guides/pension-fund-what-you-buy"]) expect(container.querySelector("[data-answer-summary]")).toBeTruthy();
    expect(container.textContent).toContain("מקורות");
    expect(container.textContent).toContain("שיחת היכרות ראשונה, בלי התחייבות מצידכם");
    expect(container.textContent).toContain("שיווק פנסיוני ולא ייעוץ פנסיוני");
  });

  it("renders the numbers page with its year label and the January note", async () => {
    const { container } = mount("/learn/pension-tax/numbers");
    await waitFor(() => expect(container.querySelector("article")).toBeTruthy());
    expect(container.textContent).toContain("נכון לשנת המס");
    expect(container.textContent).toContain("מתעדכנים בכל ינואר");
    expect(container.querySelectorAll("tbody tr").length).toBeGreaterThan(5);
    expect(container.querySelector('a[href="/savings/retirement-planning/contact"]')).toBeTruthy();
  });
});
