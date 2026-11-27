import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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
  const tab = (name: string) => within(screen.getByRole("navigation", { name: "ניווט באזור האישי" })).getByRole("link", { name });
  const signedIn = () => {
    const store = createMemorySessionStore();
    store.write("t", new Date(Date.now() + 60_000).toISOString());
    return store;
  };

  it("flag off: /my redirects home", async () => {
    await renderArea();
    expect(await screen.findByText("home page")).toBeInTheDocument();
  });

  it("flag on: id + phone -> code -> home with the picture -> tabs -> a request -> documents -> logout", async () => {
    flag.on = true;
    const { api } = await renderArea();
    expect(h2()).toBe("כניסה לאזור האישי");
    expect(screen.getByRole("heading", { level: 1, name: "האזור האישי שלכם" })).toBeInTheDocument();
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
    fireEvent.change(code, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /^כניסה/ }));
    expect(await screen.findByText("הקוד לא נכון. נשארו 4 ניסיונות.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("הקוד מההודעה"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^כניסה/ }));
    await waitFor(() => expect(h2()).toBe("שלום, ישראל"));
    expect(api.hasSession()).toBe(true);

    // home: the total, the split, what is paid, protections, notices; never an agent's name
    expect(await screen.findByText("סך החיסכון שלכם")).toBeInTheDocument();
    expect(screen.getByText("עודכן לאחרונה ב־01/11/2026")).toBeInTheDocument();
    const total = screen.getByText((_, el) => el?.classList.contains("ma-hero-num") ?? false);
    expect(total.textContent).toMatch(/523,950/);
    fireEvent.click(screen.getByRole("button", { name: "הסתרת הסכומים" }));
    expect(total.textContent).toBe("₪ ••••");
    fireEvent.click(screen.getByRole("button", { name: "הצגת הסכומים" }));
    const prot = within(screen.getByRole("region", { name: "ההגנות שלכם" }));
    expect(prot.getByText("בריאות").nextSibling?.textContent).toBe("קיים");
    expect(prot.getByText("סיעוד").nextSibling?.textContent).toBe("לא מופיע");
    expect(prot.getByText("ביטוח דירה").nextSibling?.textContent).toBe("קיים");
    expect(screen.getByText(/^ביטוח דירה מסתיים ב־\d{2}\/\d{2}\/\d{4}$/)).toBeInTheDocument();
    expect(screen.getByText("קופות לא פעילות בלי יתרה: 1")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/שמוליק|משה|המלצה/);

    // savings: cards, the year's return, the product sheet
    fireEvent.click(tab("חסכונות"));
    await waitFor(() => expect(h2()).toBe("החסכונות שלכם"));
    expect(screen.getByText("+7.9% מתחילת השנה")).toBeInTheDocument();
    expect(screen.getByText("דמי ניהול 0.22% מצבירה · 1.5% מהפקדה")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /קרן פנסיה חדשה מקיפה/ }));
    const sheet = within(await screen.findByRole("dialog", { name: "פרטי המוצר" }));
    expect(sheet.getByText("מסלול השקעה")).toBeInTheDocument();
    expect(sheet.getByText("המסלקה הפנסיונית")).toBeInTheDocument();
    fireEvent.click(sheet.getByRole("button", { name: "סגירה" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: /^גמל/ }));
    expect(screen.queryByText("קרן פנסיה חדשה מקיפה")).toBeNull();

    // insurance: live policies with covers and the end of the home policy
    fireEvent.click(tab("ביטוחים"));
    await waitFor(() => expect(h2()).toBe("הביטוחים שלכם"));
    expect(screen.getByText("ניתוחים")).toBeInTheDocument();
    expect(screen.getByText(/^תקופת הביטוח מסתיימת ב־\d{2}\/\d{2}\/\d{4}$/)).toBeInTheDocument();

    // a request: the topic is required; after sending it shows in the list as received
    fireEvent.click(screen.getByRole("button", { name: "שאלה על הביטוחים" }));
    let req = within(await screen.findByRole("dialog", { name: "פנייה לסוכן" }));
    fireEvent.click(req.getByRole("button", { name: "ביטוח" }));
    expect(req.getByRole("button", { name: "ביטוח" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(req.getByRole("button", { name: "סגירה" }));
    fireEvent.click(tab("בית"));
    await waitFor(() => expect(h2()).toBe("שלום, ישראל"));
    const asks = screen.getAllByRole("button", { name: "פנייה לסוכן" });
    expect(asks.length).toBe(2); // the home-policy notice and the question card
    fireEvent.click(asks[asks.length - 1]);
    req = within(await screen.findByRole("dialog", { name: "פנייה לסוכן" }));
    fireEvent.click(req.getByRole("button", { name: "שליחה לסוכן" }));
    expect(req.getByRole("alert")).toHaveTextContent("צריך לבחור נושא, כדי שהפנייה תגיע לסוכן הנכון.");
    fireEvent.click(req.getByRole("button", { name: "חיסכון ופנסיה" }));
    fireEvent.change(req.getByLabelText(/כמה מילים, אם רוצים/), { target: { value: "שאלה על הקרן" } });
    fireEvent.click(req.getByRole("button", { name: "וואטסאפ" }));
    fireEvent.click(req.getByRole("button", { name: "שליחה לסוכן" }));
    expect(await req.findByText("הפנייה התקבלה")).toBeInTheDocument();
    expect(req.getByText("הסוכן שלכם יחזור אליכם בהודעת וואטסאפ. הפנייה מופיעה בלשונית פניות.")).toBeInTheDocument();
    fireEvent.click(req.getByRole("button", { name: "לפניות שלי" }));
    await waitFor(() => expect(h2()).toBe("הפניות שלכם"));
    expect(await screen.findByText("שאלה על הקרן")).toBeInTheDocument();
    expect(screen.getByText("התקבלה")).toBeInTheDocument();
    expect(screen.getByText("טופלה")).toBeInTheDocument();

    // documents
    fireEvent.click(tab("מסמכים"));
    await waitFor(() => expect(h2()).toBe("המסמכים שלי"));
    expect((await screen.findAllByRole("button", { name: /הורדה/ })).length).toBe(3);
    expect(screen.queryByText(/\d{9}/)).toBeNull(); // no full id or policy number anywhere
    // logout
    fireEvent.click(screen.getByRole("button", { name: "יציאה" }));
    await waitFor(() => expect(h2()).toBe("כניסה לאזור האישי"));
    expect(api.hasSession()).toBe(false);
  });

  it("flag on: an old /my/portfolio link lands on savings; a failing adapter shows the error screen", async () => {
    flag.on = true;
    const first = await renderArea({ store: signedIn() }, "/my/portfolio");
    await waitFor(() => expect(h2()).toBe("החסכונות שלכם"));
    first.unmount();
    await renderArea({ fail: { code: "inactive" } });
    fireEvent.change(screen.getByLabelText("מספר תעודת זהות"), { target: { value: "123456782" } });
    fireEvent.change(screen.getByLabelText("טלפון נייד"), { target: { value: "0501234567" } });
    fireEvent.click(screen.getByRole("button", { name: /שליחת קוד לנייד/ }));
    expect(await screen.findByText("האזור האישי סגור כרגע")).toBeInTheDocument();
  });

  it("requests switch off: no requests tab and no request buttons", async () => {
    flag.on = true;
    await renderArea({ store: signedIn(), requestsEnabled: false }, "/my/home");
    await waitFor(() => expect(h2()).toBe("שלום, ישראל"));
    await screen.findByText("סך החיסכון שלכם");
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.queryByRole("link", { name: /פניות/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "פנייה לסוכן" })).toBeNull();
  });

  describe("Har HaBituach card (documents tab)", () => {
    const zipLike = () => new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00])], "harb.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const send = (file: File) => fireEvent.change(screen.getByLabelText("שליחת הקובץ"), { target: { files: [file] } });

    it("switch on: steps, the registry link, a sent file and the last-file line", async () => {
      flag.on = true;
      await renderArea({ store: signedIn() }, "/my/documents");
      expect(await screen.findByRole("heading", { name: "קובץ הר הביטוח" })).toBeInTheDocument();
      expect(screen.getByText("נכנסים לאתר הר הביטוח ומזדהים בהזדהות הממשלתית.")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: "לאתר הר הביטוח" });
      expect(link).toHaveAttribute("href", "https://harb.cma.gov.il/");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(screen.getByLabelText("שליחת הקובץ")).toHaveAttribute("accept", expect.stringContaining(".xlsx"));
      send(zipLike());
      expect(await screen.findByText("הקובץ התקבל. תודה!")).toBeInTheDocument();
      expect(screen.getByText(/^הקובץ האחרון התקבל ב־\d{2}\/\d{2}\/\d{4}\.$/)).toBeInTheDocument();
    });

    it("refusals show one plain line per reason; not a zip is refused before the server", async () => {
      flag.on = true;
      const first = await renderArea({ store: signedIn(), harbReason: "id_mismatch" }, "/my/documents");
      await screen.findByRole("heading", { name: "קובץ הר הביטוח" });
      send(zipLike());
      expect(await screen.findByRole("alert")).toHaveTextContent("הקובץ שייך לתעודת זהות אחרת. אפשר לשלוח רק את הקובץ שלכם.");
      first.unmount();
      await renderArea({ store: signedIn() }, "/my/documents");
      await screen.findByRole("heading", { name: "קובץ הר הביטוח" });
      send(new File(["not a spreadsheet"], "x.xlsx"));
      expect(await screen.findByRole("alert")).toHaveTextContent("זה לא קובץ האקסל של הר הביטוח. כדאי להוריד אותו שוב.");
    });

    it("switch off: no card at all", async () => {
      flag.on = true;
      await renderArea({ store: signedIn(), harbEnabled: false }, "/my/documents");
      await waitFor(() => expect(h2()).toBe("המסמכים שלי"));
      await new Promise((r) => setTimeout(r, 10));
      expect(screen.queryByRole("heading", { name: "קובץ הר הביטוח" })).toBeNull();
      expect(screen.queryByLabelText("שליחת הקובץ")).toBeNull();
    });
  });
});

describe("overview (pure)", () => {
  it("sums reported balances and live premiums, proves protections, and lists at most three notices", async () => {
    const { buildOverview } = await import("@/lib/client-area/overview");
    const today = new Date(2026, 10, 27);
    const ov = buildOverview([
      { key: "pension", label: "", products: [{ id: "a", type_code: 1, type_label: "x", company_label: "c", policy_number_masked: "****1", source: "maslaka", active: true, balance: 1000 }] },
      { key: "gemel", label: "", products: [{ id: "b", type_code: 3, type_label: "x", company_label: "c", policy_number_masked: "****2", source: "maslaka", active: false, balance: 0 }] },
      { key: "insurance_life", label: "", products: [{ id: "m", type_code: 14, type_label: "x", company_label: "c", policy_number_masked: "****3", source: "production", active: true, premium: 50, premium_frequency: "חודשית" }] },
      { key: "insurance_general", label: "", products: [
        { id: "d", type_code: 10, type_label: "ביטוח דירה", company_label: "c", policy_number_masked: "****4", source: "harbit", active: true, premium: 1200, premium_frequency: "שנתית", end: "2026-12-20", protects: ["home"] },
        { id: "o", type_code: 9, type_label: "ביטוח רכב", company_label: "c", policy_number_masked: "****5", source: "harbit", active: true, premium: 100, premium_frequency: "חודשית", end: "2027-06-01", protects: ["car"] },
        { id: "x", type_code: 9, type_label: "ביטוח רכב", company_label: "c", policy_number_masked: "****6", source: "harbit", active: false, premium: 999, premium_frequency: "חודשית", end: "2026-12-01", protects: ["car"] },
      ] },
    ], today);
    expect(ov.savingsTotal).toBe(1000);
    expect(ov.split).toEqual([{ key: "pension", amount: 1000, pct: 100 }]);
    expect(ov.monthlyPremium).toBe(150);
    expect(ov.yearlyPremium).toBe(1200);
    expect(ov.policiesActive).toBe(3);
    expect(ov.policiesInactive).toBe(1);
    expect(ov.protections.find((p) => p.key === "life")?.exists).toBe(false); // mortgage life is not life cover
    expect(ov.protections.map((p) => p.key)).toContain("car");
    expect(ov.notices.map((n) => n.kind)).toEqual(["ending", "inactive_empty"]);
    expect(ov.notices[0].kind === "ending" && ov.notices[0].days).toBe(23);
  });
});

describe("http adapter: Har HaBituach", () => {
  const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  it("sends base64 JSON with the bearer token and maps the refusal reason", async () => {
    const store = createMemorySessionStore();
    store.write("abc", new Date(Date.now() + 60_000).toISOString());
    const calls: { url: string; method?: string; body: string | null }[] = [];
    let answer = res(422, { error: { code: "harb_invalid", reason: "empty" } });
    const fetchImpl: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), method: init?.method, body: typeof init?.body === "string" ? init.body : null });
      if (String(url).endsWith("/harb") && init?.method === "GET") return res(200, { enabled: true, last_upload: null });
      return answer;
    };
    const api = createHttpClientApi({ baseUrl: "https://x.test/client-area", fetchImpl, store });
    await expect(api.harbStatus()).resolves.toEqual({ enabled: true, last_upload: null });
    await expect(api.harbUpload(new Uint8Array([0x50, 0x4b, 1, 2]))).rejects.toMatchObject({ kind: "harb_invalid", reason: "empty" });
    expect(calls[1]).toMatchObject({ url: "https://x.test/client-area/harb", method: "POST", body: JSON.stringify({ bytes_base64: "UEsBAg==" }) });
    answer = res(422, { error: { code: "harb_invalid", reason: "something-new" } });
    await expect(api.harbUpload(new Uint8Array([1]))).rejects.toMatchObject({ kind: "harb_invalid", reason: "bad_file" });
    answer = res(200, { document_id: "d1", duplicate: false, queued: true });
    await expect(api.harbUpload(new Uint8Array([1]))).resolves.toEqual({ document_id: "d1", duplicate: false, queued: true });
    await expect(api.harbUpload(new Uint8Array(2 * 1024 * 1024 + 1))).rejects.toMatchObject({ kind: "harb_invalid", reason: "too_large" });
  });
});
