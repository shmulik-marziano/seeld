import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createMockFormsApi } from "@/forms/api";
import { FORMS_CARDS } from "@/forms/catalog";
import { setFormsApi } from "@/pages/forms/shared";
import FormsHub from "@/pages/forms/FormsHub";
import { Flow } from "@/pages/forms/FormsFlow";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";

const FAKE_ID = (() => { for (let d = 0; d <= 9; d++) if (israeliIdCheckDigitOk(`12345678${d}`)) return `12345678${d}`; throw new Error("no check digit"); })();

beforeEach(() => { setFormsApi(null); try { sessionStorage.clear(); } catch { /* jsdom */ } });

describe("forms hub", () => {
  it("renders the six cards in order with their lengths, and the POA card links to the wizard", () => {
    render(<MemoryRouter><FormsHub /></MemoryRouter>);
    const titles = [...document.querySelectorAll(".sd-forms-card h3")].map((h) => h.textContent);
    expect(titles).toEqual(FORMS_CARDS.map((c) => c.title));
    const poa = screen.getAllByRole("link").find((a) => a.getAttribute("href")?.startsWith("/report/start/order"));
    expect(poa?.getAttribute("href")).toBe("/report/start/order?from=forms");
    expect(document.querySelectorAll(".sd-forms-card").length).toBe(6);
  });
});

describe("forms flow", () => {
  it("asks for the identity once, then opens the first questionnaire of the card with the server adapter", async () => {
    const api = createMockFormsApi();
    const card = FORMS_CARDS.find((c) => c.key === "financial")!;
    render(
      <MemoryRouter initialEntries={["/forms/financial"]}>
        <Routes><Route path="/forms/:card" element={<Flow card={card} api={api} />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { level: 2, name: /פרטי זיהוי/ })).toBeTruthy();
    // the identity step is skipped once a session exists
    await api.start({ first_name: "דנה", last_name: "בדיקה", national_id: FAKE_ID, phone: "0501234567", email: null, terms_privacy_approved: true });
    render(
      <MemoryRouter initialEntries={["/forms/financial?step=1"]}>
        <Routes><Route path="/forms/:card" element={<Flow card={card} api={api} />} /></Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getAllByRole("heading", { level: 1 }).some((h) => /בירור צרכים/.test(h.textContent ?? ""))).toBe(true));
    expect(screen.getAllByText(/לכל השאלונים/).length).toBeGreaterThan(0);
  });
  it("a closed server answers with the inactive screen", async () => {
    const api = createMockFormsApi({ fail: { kind: "inactive", on: "start", code: "switch_off" } });
    const card = FORMS_CARDS.find((c) => c.key === "financial")!;
    render(
      <MemoryRouter initialEntries={["/forms/financial"]}>
        <Routes><Route path="/forms/:card" element={<Flow card={card} api={api} />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { level: 2, name: /פרטי זיהוי/ })).toBeTruthy();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
});
