import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MY_COPY, myAllStrings } from "@/lib/client-area/copy";
import { ClientApiError, createHttpClientApi, type createMockClientApi } from "@/lib/client-area/api";
import { createBrowserSessionStore, createMemorySessionStore } from "@/lib/client-area/session";

const ROOT = join(__dirname, "..", "..");
const SPEC_PATH = join(ROOT, "docs", "product", "CLIENT-AREA-SPEC.md");
const APP = readFileSync(join(ROOT, "src", "App.tsx"), "utf8");

const flag = vi.hoisted(() => ({ on: false }));
vi.mock("@/lib/client-area/config", async (orig) => {
  const m = await orig<typeof import("@/lib/client-area/config")>();
  return { ...m, get CLIENT_AREA_ENABLED() { return flag.on; } };
});

afterEach(() => { vi.unstubAllEnvs(); flag.on = false; });

describe("client area switch (build time)", () => {
  const load = async () => {
    vi.resetModules();
    return (await vi.importActual<typeof import("@/lib/client-area/config")>("@/lib/client-area/config")).CLIENT_AREA_ENABLED;
  };
  it("is off when nothing is set", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", undefined as unknown as string);
    vi.stubEnv("VITE_CLIENT_AREA", undefined as unknown as string);
    expect(await load()).toBe(false);
  });
  it("is off with the flag on the legacy backend and no URL", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "legacy");
    vi.stubEnv("VITE_CLIENT_AREA", "on");
    vi.stubEnv("VITE_CLIENT_AREA_URL", "");
    expect(await load()).toBe(false);
  });
  it("is on with the flag and a URL on the legacy backend, and in v2 without a URL", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "legacy");
    vi.stubEnv("VITE_CLIENT_AREA", "on");
    vi.stubEnv("VITE_CLIENT_AREA_URL", "https://x.example.test/functions/v1/client-area/");
    expect(await load()).toBe(true);
    vi.stubEnv("VITE_SEELD_BACKEND", "v2");
    vi.stubEnv("VITE_CLIENT_AREA_URL", "");
    expect(await load()).toBe(true);
  });
  it("the route is wired lazily under /my/* and noindexed", () => {
    expect(APP).toMatch(/const MyArea = lazy\(\(\) => import\("@\/pages\/my\/MyArea"\)\)/);
    expect(APP).toContain('<Route path="/my/*" element={<MyArea />} />');
    expect(readFileSync(join(ROOT, "src", "components", "RouteSeo.tsx"), "utf8")).toContain('"/my",');
  });
});

describe("client area copy", () => {
  const SPEC = existsSync(SPEC_PATH) ? readFileSync(SPEC_PATH, "utf8") : "";
  it("the spec exists and holds every visible string verbatim", () => {
    expect(SPEC.length).toBeGreaterThan(100);
    for (const s of myAllStrings()) expect(SPEC, s).toContain(s);
    expect(MY_COPY.login.sentLead("7444")).toBe("אם הפרטים תואמים למה שרשום אצלנו, קוד בן 6 ספרות נשלח לנייד שמסתיים ב־7444.");
    expect(MY_COPY.login.wrongCodeLeft(3)).toBe("הקוד לא נכון. נשארו 3 ניסיונות.");
    expect(MY_COPY.home.title("ישראל")).toBe("שלום, ישראל");
  });
  it("site copy rules: no advice wording, no safe-word, no promises, no gendered slashes", () => {
    const all = myAllStrings().join("\n");
    expect(all).not.toMatch(/ייעוץ|יועץ|מתייעץ/u);
    expect(all).not.toMatch(/(?<![֐-׿])בטוח/u);
    expect(all).not.toMatch(/מובטח|מבטיח|ללא עלות|בחינם|ביותר/u);
    expect(all).not.toMatch(/[֐-׿]\/[֐-׿]/u);
    expect(all).not.toMatch(/\d{6,}/);
  });
});

describe("session store", () => {
  it("browser store: writes, reads, drops expired, survives a blocked storage", () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); } } as unknown as Storage;
    const s = createBrowserSessionStore(storage);
    expect(s.read()).toBeNull();
    s.write("tok", new Date(Date.now() + 60_000).toISOString());
    expect(s.read()).toBe("tok");
    s.write("old", new Date(Date.now() - 1000).toISOString());
    expect(s.read()).toBeNull();
    s.clear();
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } } as unknown as Storage;
    const b = createBrowserSessionStore(broken);
    expect(() => b.write("t", new Date(Date.now() + 1000).toISOString())).not.toThrow();
    expect(b.read()).toBeNull();
  });
});

describe("http adapter", () => {
  const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  it("sends the token as a bearer header, maps the error codes, clears the session on 401", async () => {
    const store = createMemorySessionStore();
    store.write("abc", new Date(Date.now() + 60_000).toISOString());
    const calls: { url: string; auth: string | null; body: string | null }[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      const h = new Headers(init?.headers);
      calls.push({ url: String(url), auth: h.get("authorization"), body: typeof init?.body === "string" ? init.body : null });
      if (String(url).endsWith("/me")) return res(401, { error: { code: "unauthenticated" } });
      if (String(url).endsWith("/login/verify")) return res(400, { error: { code: "wrong_code", tries_left: 2 } });
      if (String(url).endsWith("/portfolio")) return res(503, { error: { code: "inactive" } });
      return res(200, {});
    };
    const api = createHttpClientApi({ baseUrl: "https://x.test/client-area", fetchImpl, store });
    await expect(api.me()).rejects.toMatchObject({ kind: "unauthenticated" });
    expect(calls[0]).toMatchObject({ url: "https://x.test/client-area/me", auth: "Bearer abc" });
    expect(store.read()).toBeNull();
    await expect(api.loginVerify({ challenge_id: "c1", code: "000000" })).rejects.toMatchObject({ kind: "wrong_code", triesLeft: 2 });
    expect(calls[1].body).toBe(JSON.stringify({ challenge_id: "c1", code: "000000" }));
    store.write("abc", new Date(Date.now() + 60_000).toISOString());
    await expect(api.portfolio()).rejects.toMatchObject({ kind: "inactive" });
    await expect(api.documentUrl("../x")).rejects.toBeInstanceOf(ClientApiError);
  });
});

describe("client area on the mock", () => {
  // The switch tests above reset the module registry: the mock must come from the same module instance the page
  // imports, or `instanceof ClientApiError` fails and every error reads as "generic".
  const renderArea = async (opts: Parameters<typeof createMockClientApi>[0] = {}, path = "/my") => {
    const { default: MyArea } = await import("@/pages/my/MyArea");
    const mod = await import("@/lib/client-area/api");
    const api = mod.createMockClientApi(opts);
    const view = render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>home page</p>} />
          <Route path="/my/*" element={<MyArea api={api} />} />
        </Routes>
      </MemoryRouter>,
    );
    return { ...view, api };
  };
  const h2 = () => document.querySelector(".sd-my-q h2")?.textContent ?? "";

  it("flag off: /my redirects home", async () => {
    await renderArea();
    expect(await screen.findByText("home page")).toBeInTheDocument();
  });

  it("flag on: id + phone -> code -> home -> portfolio -> documents -> logout", async () => {
    flag.on = true;
    const { api } = await renderArea();
    expect(h2()).toBe("כניסה לאזור האישי");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow");
    // nothing typed: both errors, focus on the id
    fireEvent.click(screen.getByRole("button", { name: /שליחת קוד לנייד/ }));
    expect(await screen.findByText("צריך מספר תעודת זהות תקין, 9 ספרות")).toBeInTheDocument();
    expect(screen.getByText("צריך מספר נייד שמתחיל ב־05")).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement?.id).toBe("my-id"));
    fireEvent.change(screen.getByLabelText("מספר תעודת זהות"), { target: { value: "123456782" } });
    fireEvent.change(screen.getByLabelText("טלפון נייד"), { target: { value: "0501234567" } });
    fireEvent.click(screen.getByRole("button", { name: /שליחת קוד לנייד/ }));
    await waitFor(() => expect(h2()).toBe("שלחנו קוד"));
    expect(screen.getByText("אם הפרטים תואמים למה שרשום אצלנו, קוד בן 6 ספרות נשלח לנייד שמסתיים ב־4567.")).toBeInTheDocument();
    const code = screen.getByLabelText("הקוד מההודעה");
    expect(code).toHaveAttribute("autocomplete", "one-time-code");
    expect(code).toHaveAttribute("inputmode", "numeric");
    // a wrong code reports the tries left; the right one signs in
    fireEvent.change(code, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /^כניסה/ }));
    expect(await screen.findByText("הקוד לא נכון. נשארו 4 ניסיונות.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("הקוד מההודעה"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^כניסה/ }));
    await waitFor(() => expect(h2()).toBe("שלום, ישראל"));
    expect(api.hasSession()).toBe(true);
    expect(screen.getByText("5 מוצרים")).toBeInTheDocument();
    expect(screen.getByText("נכון ל־01/11/2026")).toBeInTheDocument();
    // portfolio
    fireEvent.click(screen.getByRole("link", { name: "התיק שלי" }));
    await waitFor(() => expect(h2()).toBe("התיק שלי"));
    expect(await screen.findByText("קרן פנסיה חדשה מקיפה")).toBeInTheDocument();
    expect(screen.getByText("••••4471")).toBeInTheDocument();
    expect(screen.getAllByText("המסלקה הפנסיונית").length).toBe(3); // the source row of the three clearing-house products
    expect(screen.queryByText(/\d{9}/)).toBeNull(); // no full id or policy number anywhere
    // documents
    fireEvent.click(screen.getByRole("link", { name: "מסמכים" }));
    await waitFor(() => expect(h2()).toBe("המסמכים שלי"));
    expect((await screen.findAllByRole("button", { name: /הורדה/ })).length).toBe(3);
    expect(screen.getByText("זמין דרך הסוכנות")).toBeInTheDocument();
    // logout
    fireEvent.click(screen.getByRole("button", { name: "יציאה" }));
    await waitFor(() => expect(h2()).toBe("כניסה לאזור האישי"));
    expect(api.hasSession()).toBe(false);
  });

  it("flag on: a stored session goes straight to home; a failing adapter shows the error screen", async () => {
    flag.on = true;
    const store = createMemorySessionStore();
    store.write("t", new Date(Date.now() + 60_000).toISOString());
    const first = await renderArea({ store }, "/my/portfolio");
    await waitFor(() => expect(h2()).toBe("התיק שלי"));
    first.unmount();
    await renderArea({ fail: { code: "inactive" } });
    fireEvent.change(screen.getByLabelText("מספר תעודת זהות"), { target: { value: "123456782" } });
    fireEvent.change(screen.getByLabelText("טלפון נייד"), { target: { value: "0501234567" } });
    fireEvent.click(screen.getByRole("button", { name: /שליחת קוד לנייד/ }));
    expect(await screen.findByText("האזור האישי סגור כרגע")).toBeInTheDocument();
  });
});
