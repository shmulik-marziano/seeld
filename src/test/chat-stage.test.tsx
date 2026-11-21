import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatStage from "@/components/home/ChatStage";
import { pageSuggestions } from "@/lib/chatSuggestions";

const renderStage = () => render(<MemoryRouter><ChatStage /></MemoryRouter>);

const spy = () => {
  const got: unknown[] = [];
  const on = (e: Event) => got.push((e as CustomEvent).detail);
  window.addEventListener("seeld:open-chat", on);
  return { got, stop: () => window.removeEventListener("seeld:open-chat", on) };
};

afterEach(() => vi.resetModules());

describe("home chat stage", () => {
  it("renders the headline, the lead line and the mark", async () => {
    const { container } = renderStage();
    expect(screen.getByRole("heading", { name: "שאלו את היועץ הדיגיטלי" })).toBeInTheDocument();
    expect(screen.getByText("שאלה על ביטוח, פנסיה או חיסכון? כתבו אותה וקבלו הסבר כללי, ואם צריך נחבר אתכם לצוות.")).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector("svg.seeld-lm")).not.toBeNull());
    expect(container.querySelector("#ask")).not.toBeNull();
  });

  it("the input-like button opens the chat without a prefill", () => {
    const s = spy();
    renderStage();
    fireEvent.click(screen.getByRole("button", { name: "כתבו כאן את השאלה" }));
    s.stop();
    expect(s.got).toEqual([{}]);
  });

  it("three chips from the home suggestions open the chat prefilled", () => {
    const s = spy();
    renderStage();
    const expected = pageSuggestions["/"].slice(0, 3).map((c) => c.text);
    const chips = screen.getAllByRole("listitem").map((li) => li.querySelector("button")!);
    expect(chips.map((c) => c.textContent)).toEqual(expected);
    fireEvent.click(chips[1]);
    s.stop();
    expect(s.got).toEqual([{ prefill: expected[1] }]);
  });

  it("copy rules: no forbidden words, no person names, no slash-t forms", () => {
    const { container } = renderStage();
    const text = container.textContent ?? "";
    const FORBIDDEN = [/תאגיד/u, /ללא עלות|בחינם/u, /מובטח|מבטיח/u, /ביותר/u, /[֐-׿]\/[֐-׿]/u, /שמוליק|מרזיאנו/u, /רישיון/u, /\p{Extended_Pictographic}/u];
    for (const re of FORBIDDEN) expect(text).not.toMatch(re);
  });

  it("renders nothing on the v2 build (the chat there has no text field)", async () => {
    vi.doMock("@/integrations/supabase/config", async (orig) => ({ ...(await orig<typeof import("@/integrations/supabase/config")>()), IS_V2: true }));
    const { default: V2 } = await import("@/components/home/ChatStage");
    const { container } = render(<MemoryRouter><V2 /></MemoryRouter>);
    expect(container.innerHTML).toBe("");
    vi.doUnmock("@/integrations/supabase/config");
  });

  it("renders nothing when the switch is off", async () => {
    vi.doMock("@/lib/flags/chatNudge", () => ({ CHAT_NUDGE: false }));
    const { default: Off } = await import("@/components/home/ChatStage");
    const { container } = render(<MemoryRouter><Off /></MemoryRouter>);
    expect(container.innerHTML).toBe("");
    vi.doUnmock("@/lib/flags/chatNudge");
  });
});
