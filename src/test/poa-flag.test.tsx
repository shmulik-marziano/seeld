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
    expect(APP).toContain('import { POA_ENABLED, POA_ROUTE } from "@/lib/poa/config";');
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
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toContain("פתיחת תיק בשילד");
    expect(screen.getByRole("heading", { level: 2, name: "כמה פרטים, שלושה אישורים, והמידע מגיע אלינו" })).toBeInTheDocument();
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
    // ס1: one question per screen. Before the start call the modules are unknown: no "שלב" indicator (spec §2)
    expect(h2()).toBe("מה השם הפרטי שלכם?");
    expect(screen.getByText("שאלה 1 מתוך 11")).toBeInTheDocument();
    expect(screen.queryByText(/שלב \d+ מתוך/)).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(h2El()));
    // an empty answer does not advance
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));
    expect(await screen.findByText("צריך למלא שם פרטי")).toBeInTheDocument();
    expect(h2()).toBe("מה השם הפרטי שלכם?");
    await waitFor(() => expect(document.activeElement?.id).toBe("poa-first"));
    const answer = async (label: string, value: string, next: string) => {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
      fireEvent.click(screen.getByRole("button", { name: /המשך/ }));
      await waitFor(() => expect(h2()).toBe(next));
    };
    await answer("שם פרטי", "ישראל", "ושם המשפחה?");
    await answer("שם משפחה", "ישראלי", "מה מספר תעודת הזהות?");
    const id = screen.getByLabelText("מספר תעודת זהות");
    expect(id).toHaveAttribute("dir", "ltr");
    expect(id).toHaveAttribute("inputmode", "numeric");
    await answer("מספר תעודת זהות", fakeId(), "מה תאריך הלידה שלכם?");
    expect(screen.getByLabelText("תאריך לידה")).toHaveAttribute("type", "date");
    await answer("תאריך לידה", "1980-02-01", "מתי הונפקה תעודת הזהות?");
    // an issue date before the birth date does not advance
    fireEvent.change(screen.getByLabelText("תאריך הנפקה"), { target: { value: "1979-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));
    expect(await screen.findByText("תאריך ההנפקה מוקדם מתאריך הלידה, כדאי לבדוק שוב.")).toBeInTheDocument();
    await answer("תאריך הנפקה", "2015-03-15", "מה הכתובת? רחוב ומספר בית");
    await answer("רחוב ומספר בית", "הרצל 1", "ובאיזה יישוב?");
    await answer("יישוב", "תל אביב", "ומה המיקוד?");
    // the mock adapter "knows" the address: the zip is filled in and announced, and still confirmed by the visitor
    const zip = screen.getByLabelText("מיקוד");
    expect(zip).toHaveAttribute("inputmode", "numeric");
    await waitFor(() => expect(zip).toHaveValue("1000000"));
    expect(screen.getByText("המיקוד נמצא לפי הכתובת. אפשר לתקן אם צריך.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "חיפוש מיקוד באתר דואר ישראל" })).toHaveAttribute("target", "_blank");
    await answer("מיקוד", "6473912", "מה מספר הנייד?");
    expect(screen.getByLabelText("טלפון נייד")).toHaveAttribute("inputmode", "numeric");
    await answer("טלפון נייד", "0501234567", "ודוא\"ל?");
    expect(screen.getByLabelText("דוא\"ל (לא חובה)")).toHaveAttribute("type", "email");
    fireEvent.click(screen.getByRole("button", { name: "דילוג" }));
    await waitFor(() => expect(h2()).toBe("עוד רגע ומתחילים"));
    expect(screen.getByText("שאלה 11 מתוך 11")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));
    expect(await screen.findByText("כדי להמשיך צריך לאשר את תנאי השימוש ומדיניות הפרטיות.")).toBeInTheDocument();
    const terms = screen.getByRole("checkbox", { name: /קראתי ואישרתי את/ });
    expect(terms.closest("label")?.textContent).toBe("קראתי ואישרתי את תנאי השימוש ומדיניות הפרטיות");
    expect(screen.getByRole("checkbox", { name: /שיווקי/ })).not.toBeChecked();
    fireEvent.click(terms);
    expect(screen.getByRole("link", { name: "תנאי השימוש" })).toHaveAttribute("target", "_blank");
    fireEvent.click(screen.getByRole("button", { name: /המשך/ }));

    await waitFor(() => expect(h2()).toContain("הפרטים שיופיעו במסמכים"));
    expect(screen.getByText(fakeId())).toBeInTheDocument();
    expect(screen.getByText(/הרצל 1, תל אביב/)).toBeInTheDocument();
    expect(screen.getByText("6473912")).toBeInTheDocument();
    expect(screen.getByText("01/02/1980")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "תיקון" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /אישור הפרטים והמשך/ }));

    await waitFor(() => expect(h2()).toBe("שלב 3 מתוך 4: המסלקה הפנסיונית"));
    await waitFor(() => expect(document.activeElement).toBe(h2El()));
    expect(screen.getByText("במסמך מופיע בעל הרישיון שמטפל בתיק שלכם.")).toBeInTheDocument();
    expect(screen.getByText("למי פונים")).toBeInTheDocument();
    expect(screen.queryByText("תוקף")).toBeNull(); // template not approved: validity row hidden
    await waitFor(() => expect(screen.getByRole("button", { name: "צפייה במסמך" })).toBeEnabled(), { timeout: 5000 }); // the mock builds a real PDF: slow under a full parallel run
    fireEvent.click(screen.getByRole("button", { name: /אישור והמשך/ }));
    expect(await screen.findByText("כדי להמשיך צריך לסמן את האישור.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /למסלקה הפנסיונית בשמי/ }));
    fireEvent.click(screen.getByRole("button", { name: /אישור והמשך/ }));

    await waitFor(() => expect(h2()).toBe("שלב 4 מתוך 4: הר הביטוח"));
    expect(screen.queryByLabelText("תאריך לידה")).toBeNull(); // the dates were answered in ס1
    expect(screen.getByText("במסמך מופיעים תאריך הלידה ותאריך ההנפקה שמסרתם.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /אישור והמשך/ })).toBeEnabled(), { timeout: 5000 }); // the mock builds a real PDF: slow under a full parallel run
    fireEvent.click(screen.getByRole("button", { name: /אישור והמשך/ }));
    expect(await screen.findByText("כדי להמשיך צריך לסמן את האישור.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /הר הביטוח בשמי/ }));
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
    const next = () => fireEvent.click(screen.getByRole("button", { name: /המשך/ }));
    for (const [label, value] of [["שם פרטי", "ישראל"], ["שם משפחה", "ישראלי"], ["מספר תעודת זהות", fakeId()], ["תאריך לידה", "1980-02-01"],
      ["תאריך הנפקה", "2015-03-15"], ["רחוב ומספר בית", "הרצל 1"], ["יישוב", "תל אביב"], ["מיקוד", "6473912"], ["טלפון נייד", "0501234567"]]) {
      fireEvent.change(await screen.findByLabelText(label), { target: { value } });
      next();
    }
    fireEvent.click(await screen.findByRole("button", { name: "דילוג" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: /תנאי השימוש/ }));
    next();
    fireEvent.click(await screen.findByRole("button", { name: /אישור הפרטים והמשך/ }));
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
