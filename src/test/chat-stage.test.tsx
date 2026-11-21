import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
  it("renders the headline, the lead line and the mark", () => {
    const { container } = renderStage();
    expect(screen.getByRole("heading", { name: "שאלו את היועץ הדיגיטלי" })).toBeInTheDocument();
    expect(screen.getByText("שאלה על ביטוח, פנסיה או חיסכון? כתבו אותה וקבלו הסבר כללי, ואם צריך נחבר אתכם לצוות.")).toBeInTheDocument();
    expect(container.querySelector("svg.seeld-lm")).not.toBeNull();
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
    for (const w of ["תאגיד", "ללא עלות", "בחינם", "ביותר", "מובטח", "מבטיח", "/ת", "שמוליק", "מרזיאנו", "רישיון"]) {
      expect(text).not.toContain(w);
    }
  });

  it("renders nothing when the switch is off", async () => {
    vi.doMock("@/lib/flags/chatNudge", () => ({ CHAT_NUDGE: false }));
    const { default: Off } = await import("@/components/home/ChatStage");
    const { container } = render(<MemoryRouter><Off /></MemoryRouter>);
    expect(container.innerHTML).toBe("");
    vi.doUnmock("@/lib/flags/chatNudge");
  });
});
