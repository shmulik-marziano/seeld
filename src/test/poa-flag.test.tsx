import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import fs from "node:fs";
import path from "node:path";
import { join } from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";

const ROOT = join(__dirname, "..", "..");
const APP = readFileSync(join(ROOT, "src", "App.tsx"), "utf8");

// The page reads POA_ENABLED at render time; a getter lets each test flip it without reloading React.
const flag = vi.hoisted(() => ({ on: false }));
vi.mock("@/lib/poa/config", async (orig) => {
  const m = await orig<typeof import("@/lib/poa/config")>();
  return { ...m, get POA_ENABLED() { return flag.on; } };
});

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); flag.on = false; });

describe("POA switch (build time)", () => {
  const load = async () => {
    vi.resetModules();
    const real = await vi.importActual<typeof import("@/lib/poa/config")>("@/lib/poa/config");
    return real.POA_ENABLED;
  };
  it("is off when nothing is set", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", undefined as unknown as string);
    vi.stubEnv("VITE_POA_FLOW", undefined as unknown as string);
    expect(await load()).toBe(false);
  });
  it("is off in v2 without VITE_POA_FLOW", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "v2");
    vi.stubEnv("VITE_POA_FLOW", undefined as unknown as string);
    expect(await load()).toBe(false);
  });
  it("is off with VITE_POA_FLOW=on on the legacy backend", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "legacy");
    vi.stubEnv("VITE_POA_FLOW", "on");
    expect(await load()).toBe(false);
  });
  it("is off with VITE_POA_FLOW=on on the legacy backend and an empty intake URL", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "legacy");
    vi.stubEnv("VITE_POA_FLOW", "on");
    vi.stubEnv("VITE_POA_INTAKE_URL", "  ");
    expect(await load()).toBe(false);
  });
  it("fast path: on with VITE_POA_FLOW=on on the legacy backend when VITE_POA_INTAKE_URL is set", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "legacy");
    vi.stubEnv("VITE_POA_FLOW", "on");
    vi.stubEnv("VITE_POA_INTAKE_URL", "https://intake.example.test/functions/v1/poa-intake/");
    expect(await load()).toBe(true);
    const real = await vi.importActual<typeof import("@/lib/poa/config")>("@/lib/poa/config");
    expect(real.POA_INTAKE_URL).toBe("https://intake.example.test/functions/v1/poa-intake");
  });
  it("is off without VITE_POA_FLOW even when the intake URL is set", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "legacy");
    vi.stubEnv("VITE_POA_FLOW", undefined as unknown as string);
    vi.stubEnv("VITE_POA_INTAKE_URL", "https://intake.example.test/x");
    expect(await load()).toBe(false);
  });
  it("is off for any value but \"on\"", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "v2");
    vi.stubEnv("VITE_POA_FLOW", "true");
    expect(await load()).toBe(false);
  });
  it("is on in v2 with VITE_POA_FLOW=on (the intake URL is optional there)", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "v2");
    vi.stubEnv("VITE_POA_FLOW", "on");
    expect(await load()).toBe(true);
  });
});

describe("POA route in App.tsx", () => {
  it("is lazy, outside hold(), and redirects when off", () => {
    expect(APP).toContain('const PoaFlow = lazy(() => import("@/pages/report-order/PoaFlow"));');
    expect(APP).toContain('<Route path="/report/start/order" element={POA_ENABLED ? <PoaFlow /> : <Navigate to="/report/start" replace />} />');
    expect(APP).not.toMatch(/hold\(<PoaFlow/);
    expect(APP).toContain('import { POA_ENABLED } from "@/lib/poa/config";');
    // nothing else of the wizard joins the main entry
    expect(APP).not.toMatch(/from "@\/lib\/poa\/(api|copy|machine|draftPdf)"/);
    expect(APP).not.toMatch(/from "@\/pages\/report-order\//);
  });

  it("is noindex", () => {
    const seo = readFileSync(join(ROOT, "src", "components", "RouteSeo.tsx"), "utf8");
    expect(seo).toMatch(/"\/report\/start\/order"/);
  });
});

const font = (n: string) => new Uint8Array(fs.readFileSync(path.resolve("public/fonts", n)));
const fakeId = () => { for (let d = 0; d <= 9; d++) if (israeliIdCheckDigitOk(`12345678${d}`)) return `12345678${d}`; throw new Error("x"); };

/** The wizard's own h2 (the site header and footer have headings too). */
const h2 = () => document.querySelector(".sd-poa-q h2")?.textContent ?? "";
const h2El = () => document.querySelector(".sd-poa-q h2");

async function renderFlow(api?: import("@/lib/poa/api").PoaApi) {
  const { default: PoaFlow } = await import("@/pages/report-order/PoaFlow");
  return render(
    <MemoryRouter initialEntries={["/report/start/order"]}>
      <Routes>
        <Route path="/report/start" element={<p>report start</p>} />
        <Route path="/report/start/order" element={<PoaFlow api={api} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("POA page", () => {
  it("flag off: redirects to /report/start", async () => {
    flag.on = false;
    await renderFlow();
    expect(screen.getByText("report start")).toBeInTheDocument();
  });

  it("flag on: renders ס0 with one h1, noindex, and sends nothing", async () => {
    flag.on = true;
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    await renderFlow();
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toContain("ייפויי כוח לאיסוף מידע");
    expect(screen.getByRole("heading", { level: 2, name: "מאשרים לנו לבקש את המידע בשמכם" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /מתחילים/ })).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"][content="noindex, nofollow"]')).not.toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("flag on: walks the wizard on the mock (policies disabled) to the summary", async () => {
    flag.on = true;
    const { createMockPoaApi } = await import("@/lib/poa/api");
    const api = createMockPoaApi({ fonts: { regular: font("Rubik-Regular.ttf"), bold: font("Rubik-Bold.ttf") }, modules: { policies: { enabled: false } } });
    const set = vi.spyOn(Storage.prototype, "setItem");
    await renderFlow(api);

    fireEvent.click(screen.getByRole("button", { name: /מתחילים/ }));
    // before the start call the modules are unknown: no indicator, so M never changes once shown (spec §2)
    expect(h2()).toBe("כמה פרטים מזהים");
    expect(screen.queryByText(/מתוך/)).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(h2El()));
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));
    expect(await screen.findByText("צריך למלא שם פרטי")).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement?.id).toBe("poa-first"));
    fireEvent.change(screen.getByLabelText("שם פרטי"), { target: { value: "ישראל" } });
    fireEvent.change(screen.getByLabelText("שם משפחה"), { target: { value: "ישראלי" } });
    const id = screen.getByLabelText("מספר תעודת זהות");
    expect(id).toHaveAttribute("dir", "ltr");
    expect(id).toHaveAttribute("inputmode", "numeric");
    fireEvent.change(id, { target: { value: fakeId() } });
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));

    expect(h2()).toContain("איך ליצור איתכם קשר");
    await waitFor(() => expect(document.activeElement).toBe(h2El()));
    fireEvent.change(screen.getByLabelText("טלפון נייד"), { target: { value: "0501234567" } });
    const terms = screen.getByRole("checkbox", { name: /קראתי ואישרתי את/ });
    expect(terms.closest("label")?.textContent).toBe("קראתי ואישרתי את תנאי השימוש ומדיניות הפרטיות");
    expect(screen.getByRole("checkbox", { name: /שיווקי/ })).not.toBeChecked();
    fireEvent.click(terms);
    expect(screen.getByRole("link", { name: "תנאי השימוש" })).toHaveAttribute("target", "_blank");
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));

    expect(h2()).toContain("הפרטים שיופיעו במסמכים");
    expect(screen.getByText(fakeId())).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "תיקון" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /אישור הפרטים והמשך/ }));

    await waitFor(() => expect(h2()).toBe("שלב 4 מתוך 5: המסלקה הפנסיונית"));
    await waitFor(() => expect(document.activeElement).toBe(h2El()));
    expect(screen.getByText("במסמך מופיע בעל הרישיון שמטפל בתיק שלכם.")).toBeInTheDocument();
    expect(screen.getByText("למי פונים")).toBeInTheDocument();
    expect(screen.queryByText("תוקף")).toBeNull(); // template not approved: validity row hidden
    await waitFor(() => expect(screen.getByRole("button", { name: "צפייה במסמך" })).toBeEnabled(), { timeout: 5000 }); // the mock builds a real PDF: slow under a full parallel run
    fireEvent.click(screen.getByRole("button", { name: /אישור והמשך/ }));
    expect(await screen.findByText("כדי להמשיך צריך לסמן את האישור.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /למסלקה הפנסיונית בשמי/ }));
    fireEvent.click(screen.getByRole("button", { name: /אישור והמשך/ }));

    await waitFor(() => expect(h2()).toBe("שלב 5 מתוך 5: הר הביטוח"));
    const birth = screen.getByLabelText("תאריך לידה");
    expect(birth).toHaveAttribute("dir", "ltr");
    expect(birth).toHaveAttribute("inputmode", "numeric");
    fireEvent.change(birth, { target: { value: "01/02/1980" } });
    fireEvent.change(screen.getByLabelText("תאריך הנפקה"), { target: { value: "01/01/1979" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /הר הביטוח בשמי/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /אישור והמשך/ })).toBeEnabled(), { timeout: 5000 }); // the mock builds a real PDF: slow under a full parallel run
    fireEvent.click(screen.getByRole("button", { name: /אישור והמשך/ }));
    expect(await screen.findByText("תאריך ההנפקה מוקדם מתאריך הלידה, כדאי לבדוק שוב.")).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement?.id).toBe("poa-issue"));
    fireEvent.change(screen.getByLabelText("תאריך הנפקה"), { target: { value: "15/03/2015" } });
    fireEvent.click(screen.getByRole("button", { name: /אישור והמשך/ }));

    await waitFor(() => expect(h2()).toBe("קיבלנו את האישורים"));
    await waitFor(() => expect(document.activeElement).toBe(h2El()));
    expect(screen.getAllByRole("button", { name: /הורדה/ })).toHaveLength(2);
    expect(screen.getAllByText("סימון")).toHaveLength(2);
    expect(screen.queryByText("תוקף")).toBeNull(); // no approved template: no validity row on the summary
    expect(set).not.toHaveBeenCalled();
    set.mockRestore();
  });

  it("flag on: a failing adapter shows the ס8 screen with its one action", async () => {
    flag.on = true;
    const { createMockPoaApi } = await import("@/lib/poa/api");
    await renderFlow(createMockPoaApi({ fail: { code: "unavailable" } }));
    fireEvent.click(screen.getByRole("button", { name: /מתחילים/ }));
    fireEvent.change(screen.getByLabelText("שם פרטי"), { target: { value: "ישראל" } });
    fireEvent.change(screen.getByLabelText("שם משפחה"), { target: { value: "ישראלי" } });
    fireEvent.change(screen.getByLabelText("מספר תעודת זהות"), { target: { value: fakeId() } });
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));
    fireEvent.change(screen.getByLabelText("טלפון נייד"), { target: { value: "0501234567" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /תנאי השימוש/ }));
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));
    fireEvent.click(screen.getByRole("button", { name: /אישור הפרטים והמשך/ }));
    await waitFor(() => expect(h2()).toBe("השירות אינו זמין כרגע"));
    expect(screen.getByText("נסו שוב בעוד כמה רגעים")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "נסו שוב" }));
    expect(h2()).toContain("הפרטים שיופיעו במסמכים");
  });
});

describe("POA ס6 signature", () => {
  it("a missing signature shows the error and moves focus to the signature group", async () => {
    // jsdom has no canvas: a do-nothing 2D context is enough for the pad to mount
    const ctx = new Proxy({}, { get: () => () => undefined, set: () => true });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const { Policies } = await import("@/pages/report-order/screens/Policies");
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <Policies headingRef={{ current: null }} dir="fwd" prog={null} busy={false} pdf={new Blob(["x"])} onSubmit={onSubmit} />
      </MemoryRouter>,
    );
    expect(screen.getByText("חתימה על ייפוי כוח פוליסות", { selector: "p" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /חתימה וסיום/ }));
    expect(await screen.findByText("צריך לחתום במסגרת כדי להמשיך.")).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement?.id).toBe("poa-sig"));
    const group = document.getElementById("poa-sig")!;
    expect(group).toHaveAttribute("role", "group");
    expect(group.getAttribute("aria-describedby")).toContain("poa-sig-err");
    expect(group.getAttribute("aria-describedby")).toContain("poa-alt-btn");
    expect(onSubmit).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
