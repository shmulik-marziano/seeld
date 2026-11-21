import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatNudge from "@/components/ChatNudge";
import AIChatBotLoader from "@/components/AIChatBotLoader";
import AIChatBot from "@/components/AIChatBot";

vi.mock("@/integrations/supabase/site-client", () => ({
  siteSupabase: {
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    from: vi.fn(() => ({ insert: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
  },
}));
vi.mock("@/integrations/supabase/client", () => ({
  SUPABASE_URL: "http://localhost.invalid",
  SUPABASE_PUBLISHABLE_KEY: "test-key",
}));

const ASK = "שאלו";
const CLOSE = "סגירת ההצעה";

const renderNudge = (path = "/") =>
  render(<MemoryRouter initialEntries={[path]}><ChatNudge /></MemoryRouter>);

const wait = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

const setWebdriver = (v: boolean | undefined) =>
  Object.defineProperty(window.navigator, "webdriver", { value: v, configurable: true });

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  window.localStorage.clear();
  setWebdriver(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("chat nudge", () => {
  it("shows after 35 seconds with the first question for the page", async () => {
    renderNudge("/insurances");
    await wait(34_000);
    expect(screen.queryByRole("status")).toBeNull();
    await wait(1_100);
    const bubble = screen.getByRole("status");
    expect(bubble).toHaveAttribute("aria-live", "polite");
    expect(bubble).toHaveAttribute("data-prerender-skip");
    expect(bubble.textContent).toContain("איזה ביטוח מתאים לי?");
    expect(screen.getByRole("button", { name: ASK })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CLOSE })).toBeInTheDocument();
  });

  it("uses the default list on a page without its own suggestions", async () => {
    renderNudge("/something-else");
    await wait(36_000);
    expect(screen.getByRole("status").textContent).toContain("איך מתחיל תהליך הייעוץ?");
  });

  it("shows when the visitor scrolls past 60% of the document", async () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 4000, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    renderNudge("/");
    Object.defineProperty(window, "scrollY", { value: 1000, configurable: true });
    await act(async () => { window.dispatchEvent(new Event("scroll")); });
    expect(screen.queryByRole("status")).toBeNull();
    Object.defineProperty(window, "scrollY", { value: 1700, configurable: true });
    await act(async () => { window.dispatchEvent(new Event("scroll")); });
    expect(screen.getByRole("status")).toBeInTheDocument();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("at most once per browser session", async () => {
    const first = renderNudge("/");
    await wait(36_000);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("seeld_nudge_shown")).toBe("1");
    first.unmount();
    renderNudge("/");
    await wait(60_000);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("not for 7 days after a dismissal, then again", async () => {
    const first = renderNudge("/");
    await wait(36_000);
    fireEvent.click(screen.getByRole("button", { name: CLOSE }));
    expect(screen.queryByRole("status")).toBeNull();
    expect(window.localStorage.getItem("seeld_nudge_dismissed_at")).not.toBeNull();
    first.unmount();

    window.sessionStorage.clear();
    const second = renderNudge("/");
    await wait(36_000);
    expect(screen.queryByRole("status")).toBeNull();
    second.unmount();

    window.localStorage.setItem("seeld_nudge_dismissed_at", String(Date.now() - 8 * 24 * 60 * 60 * 1000));
    window.sessionStorage.clear();
    renderNudge("/");
    await wait(36_000);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it.each(["/app", "/app/auth", "/q/abc", "/report", "/contact", "/privacy", "/terms", "/accessibility", "/auth", "/admin"])(
    "never on %s",
    async (path) => {
      renderNudge(path);
      await wait(60_000);
      expect(screen.queryByRole("status")).toBeNull();
    },
  );

  it("never under webdriver", async () => {
    setWebdriver(true);
    renderNudge("/");
    await wait(60_000);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("storage errors do not break it", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    renderNudge("/");
    await wait(36_000);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("closes when the chat opens", async () => {
    renderNudge("/");
    await wait(36_000);
    expect(screen.getByRole("status")).toBeInTheDocument();
    await act(async () => { window.dispatchEvent(new Event("seeld:open-chat")); });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("'ask' dispatches seeld:open-chat with the question as prefill", async () => {
    const got: unknown[] = [];
    const on = (e: Event) => got.push((e as CustomEvent).detail);
    window.addEventListener("seeld:open-chat", on);
    renderNudge("/");
    await wait(36_000);
    fireEvent.click(screen.getByRole("button", { name: ASK }));
    window.removeEventListener("seeld:open-chat", on);
    expect(got).toEqual([{ prefill: "מה כולל אפיון צרכים?" }]);
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("chat prefill", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("no network"))));
  });

  it("a mounted chat fills the textarea and does not send", async () => {
    render(<MemoryRouter><AIChatBot defaultOpen /></MemoryRouter>);
    await act(async () => {
      window.dispatchEvent(new CustomEvent("seeld:open-chat", { detail: { prefill: "איך בוחרים קרן פנסיה?" } }));
    });
    const box = screen.getByRole("textbox", { name: "הודעה ליועץ הדיגיטלי" }) as HTMLTextAreaElement;
    expect(box.value).toBe("איך בוחרים קרן פנסיה?");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("the loader mounts the chat with the prefill from the event", async () => {
    render(<MemoryRouter><AIChatBotLoader /></MemoryRouter>);
    await act(async () => {
      window.dispatchEvent(new CustomEvent("seeld:open-chat", { detail: { prefill: "מה כולל אפיון צרכים?" } }));
    });
    const box = (await screen.findByRole("textbox", { name: "הודעה ליועץ הדיגיטלי" })) as HTMLTextAreaElement;
    expect(box.value).toBe("מה כולל אפיון צרכים?");
    expect(fetch).not.toHaveBeenCalled();
  });
});
