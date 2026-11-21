import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AIChatBot from "@/components/AIChatBot";

vi.mock("@/integrations/supabase/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/integrations/supabase/config")>()),
  IS_V2: true,
  FORMS_ENABLED: true,
  TURNSTILE_SITE_KEY: "",
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

let leadStatus = 200;
let reply = "בשמחה, אפשר להסביר.";
const calls: { url: string; init?: RequestInit }[] = [];

const sse = (text: string) => {
  const chunk = new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\ndata: [DONE]\n`);
  let sent = false;
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: () => {
          if (sent) return Promise.resolve({ done: true, value: undefined });
          sent = true;
          return Promise.resolve({ done: false, value: chunk });
        },
      }),
    },
  };
};

const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  calls.push({ url, init });
  if (String(url).endsWith("/lead-intake")) {
    return { ok: leadStatus === 200, status: leadStatus, json: async () => (leadStatus === 200 ? { ok: true } : { error: "unavailable" }) };
  }
  return sse(reply);
});

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  leadStatus = 200;
  reply = "בשמחה, אפשר להסביר.";
  calls.length = 0;
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const renderBot = () => render(<MemoryRouter initialEntries={["/insurances"]}><AIChatBot defaultOpen /></MemoryRouter>);

const say = async (text: string) => {
  const box = screen.getByRole("textbox", { name: "הודעה ליועץ הדיגיטלי" });
  fireEvent.change(box, { target: { value: text } });
  await act(async () => { fireEvent.submit(box.closest("form")!); });
  await waitFor(() => expect(screen.queryByRole("button", { name: "שליחת הודעה" })).not.toBeNull());
};

const CARD_TITLE = "רוצים שנחזור אליכם?";

describe("lead card in the chat", () => {
  it("appears after a visitor message that signals intent", async () => {
    renderBot();
    expect(screen.queryByText(CARD_TITLE)).toBeNull();
    await say("אפשר לקבוע פגישה?");
    expect(await screen.findByText(CARD_TITLE)).toBeInTheDocument();
  });

  it("appears when the assistant reply signals intent", async () => {
    reply = "אפשר לדבר עם נציג בשעות הפעילות.";
    renderBot();
    await say("שאלה כללית");
    expect(await screen.findByText(CARD_TITLE)).toBeInTheDocument();
  });

  it("appears after the third visitor message, not before", async () => {
    renderBot();
    await say("שאלה ראשונה");
    await say("שאלה שנייה");
    expect(screen.queryByText(CARD_TITLE)).toBeNull();
    await say("שאלה שלישית");
    expect(await screen.findByText(CARD_TITLE)).toBeInTheDocument();
  });

  it("shows once per conversation: not now hides it and it does not come back", async () => {
    renderBot();
    await say("רוצה הצעת מחיר");
    fireEvent.click(await screen.findByRole("button", { name: "לא עכשיו" }));
    expect(screen.queryByText(CARD_TITLE)).toBeNull();
    await say("עוד שאלה על טלפון");
    expect(screen.queryByText(CARD_TITLE)).toBeNull();
  });

  it("the welcome link opens the same card", () => {
    renderBot();
    fireEvent.click(screen.getByRole("button", { name: "להשאיר פרטים לחזרה" }));
    expect(screen.getByText(CARD_TITLE)).toBeInTheDocument();
  });

  it("validates name, Israeli phone and consent before sending", async () => {
    renderBot();
    fireEvent.click(screen.getByRole("button", { name: "להשאיר פרטים לחזרה" }));
    fireEvent.click(screen.getByRole("button", { name: "השאירו פרטים" }));
    expect(screen.getByText("נא למלא שם.")).toBeInTheDocument();
    expect(screen.getByText("נא למלא מספר טלפון ישראלי תקין.")).toBeInTheDocument();
    expect(screen.getByText("כדי לשלוח צריך לאשר שנחזור אליכם.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("שם"), { target: { value: "דנה" } });
    fireEvent.change(screen.getByLabelText("טלפון"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "השאירו פרטים" }));
    expect(screen.getByText("נא למלא מספר טלפון ישראלי תקין.")).toBeInTheDocument();
    expect(calls.some((c) => c.url.endsWith("/lead-intake"))).toBe(false);
  });

  it("submits the contact payload with consent, no transcript, then shows the thanks", async () => {
    renderBot();
    await say("אפשר לקבוע פגישה?");
    await screen.findByText(CARD_TITLE);
    fireEvent.change(screen.getByLabelText("שם"), { target: { value: "דנה לוי" } });
    fireEvent.change(screen.getByLabelText("טלפון"), { target: { value: "050-1234567" } });
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "השאירו פרטים" })); });

    await waitFor(() => expect(screen.getByText("קיבלנו. הצוות יחזור אליכם בשעות הפעילות.")).toBeInTheDocument());
    const lead = calls.find((c) => c.url.endsWith("/lead-intake"))!;
    expect(lead.url).toMatch(/\/functions\/v1\/lead-intake$/);
    const body = JSON.parse(String(lead.init?.body));
    expect(body).toMatchObject({
      kind: "contact",
      full_name: "דנה לוי",
      phone: "050-1234567",
      consent: true,
      consent_version: "v1",
      source: "/insurances",
      message: "מקור: צ'אט",
      payload: { subject: "צ'אט", page: "/insurances" },
    });
    expect(JSON.stringify(body)).not.toContain("אפשר לקבוע פגישה");
    expect((lead.init?.headers as Record<string, string>)["idempotency-key"]).toBeTruthy();
    expect(screen.queryByText(CARD_TITLE)).toBeNull();
  });

  it("shows the mapped error text when the intake fails", async () => {
    leadStatus = 503;
    renderBot();
    fireEvent.click(screen.getByRole("button", { name: "להשאיר פרטים לחזרה" }));
    fireEvent.change(screen.getByLabelText("שם"), { target: { value: "דנה" } });
    fireEvent.change(screen.getByLabelText("טלפון"), { target: { value: "0501234567" } });
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "השאירו פרטים" })); });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("השירות לא זמין כרגע");
    expect(screen.getByText(CARD_TITLE)).toBeInTheDocument();
  });
});
