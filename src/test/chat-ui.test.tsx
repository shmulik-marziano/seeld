import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AIChatBot from "@/components/AIChatBot";
import ChatLauncher from "@/components/ChatLauncher";

const mark = vi.hoisted(() => ({ on: true }));
vi.mock("@/lib/flags/liveMark", () => ({
  get LIVE_MARK() { return mark.on; },
}));

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

const fetchMock = vi.fn(() => Promise.reject(new Error("no network in tests")));

afterEach(() => {
  mark.on = true;
  fetchMock.mockClear();
});

const ROOT = join(__dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

const renderBot = () => {
  vi.stubGlobal("fetch", fetchMock);
  return render(<MemoryRouter><AIChatBot /></MemoryRouter>);
};

const openChat = async () => {
  await act(async () => { window.dispatchEvent(new Event("seeld:open-chat")); });
};

describe("chat launcher", () => {
  it("flag on: the mark and the label, old look classes kept", async () => {
    const { container } = renderBot();
    const btn = screen.getByRole("button", { name: "פתחו שיחה עם היועץ הדיגיטלי של SEELD" });
    expect(btn).toHaveClass("sd-chrome-fab", "sd-chrome-fab-chat", "sd-chrome-fab-chat--live");
    expect(btn).toHaveAttribute("data-prerender-skip");
    expect(container.querySelector("svg.seeld-lm")).not.toBeNull();
    expect(btn.textContent).toBe("היועץ הדיגיטלי");
  });

  it("hover moves the mark to listening", () => {
    const { container } = render(<ChatLauncher />);
    const svg = () => container.querySelector("svg.seeld-lm");
    expect(svg()).toHaveAttribute("data-logo-state", "idle");
    fireEvent.pointerEnter(screen.getByRole("button"));
    expect(svg()).toHaveAttribute("data-logo-state", "listening");
    fireEvent.pointerLeave(screen.getByRole("button"));
    expect(svg()).toHaveAttribute("data-logo-state", "idle");
  });

  it("flag off: the old launcher, no live mark", () => {
    mark.on = false;
    const { container } = renderBot();
    const btn = screen.getByRole("button", { name: "פתחו שיחה עם היועץ הדיגיטלי של SEELD" });
    expect(btn).not.toHaveClass("sd-chrome-fab-chat--live");
    expect(btn.textContent).toBe("שיחה עם היועץ הדיגיטלי");
    expect(container.querySelector("svg.seeld-lm")).toBeNull();
  });
});

describe("chat panel", () => {
  it("opens on seeld:open-chat with the mark, status label and disclaimer", async () => {
    const { container } = renderBot();
    await openChat();
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelectorAll("svg.seeld-lm").length).toBeGreaterThanOrEqual(2);
    // The input is focused on open (existing behaviour), so the status starts as "listening".
    expect(screen.getByText("מקשיב")).toBeInTheDocument();
    fireEvent.blur(screen.getByLabelText("הודעה ליועץ הדיגיטלי"));
    expect(screen.getByText("זמין")).toBeInTheDocument();
    expect(screen.getByText("מידע כללי בלבד. לא ייעוץ אישי.")).toBeInTheDocument();
    expect(screen.getByText("שלום, כאן היועץ הדיגיטלי.")).toBeInTheDocument();
    expect(container.querySelector(".sd-chrome-fab")).toBeNull();
  });

  it("the header has exactly one close button", async () => {
    renderBot();
    await openChat();
    expect(screen.getAllByRole("button", { name: "סגירת הצ'אט" })).toHaveLength(1);
  });

  it("focusing the input shows the listening status", async () => {
    renderBot();
    await openChat();
    const input = screen.getByLabelText("הודעה ליועץ הדיגיטלי");
    fireEvent.blur(input);
    expect(screen.getByText("זמין")).toBeInTheDocument();
    fireEvent.focus(input);
    expect(screen.getByText("מקשיב")).toBeInTheDocument();
  });

  it("flag off: the old navy-band panel", async () => {
    mark.on = false;
    renderBot();
    await openChat();
    expect(screen.getByText("שלום, כאן היועץ הדיגיטלי של SEELD.")).toBeInTheDocument();
    expect(screen.queryByText("זמין")).toBeNull();
  });
});

describe("chat ui copy rules", () => {
  const HE = "\u0590-\u05FFA-Za-z";
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
    ["emoji", /\p{Extended_Pictographic}/u],
    ["names", NAME_RE],
  ];
  const bot = read("src", "components", "AIChatBot.tsx").replace(/\r\n/g, "\n");
  const from = bot.indexOf("  if (LIVE_MARK) {");
  const liveBlock = bot.slice(from, bot.indexOf("{/* ── Launcher", from));
  const css = read("src", "components", "sd", "chrome.css");
  const RAW = [
    read("src", "components", "ChatLauncher.tsx"),
    liveBlock,
    css.slice(css.indexOf("Live-mark chat launcher")),
  ].join("\n");

  it("the live block was found", () => expect(liveBlock.length).toBeGreaterThan(1000));
  for (const [name, re] of FORBIDDEN) {
    it(`no ${name}`, () => expect(RAW).not.toMatch(re));
  }
});
