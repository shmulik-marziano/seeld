import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { QuestionnaireSchema, UNKNOWN } from "@/questionnaires/types";
import type { Answers, Questionnaire } from "@/questionnaires/types";
import {
  addEntry, computeFlow, computeProgress, conditionMet, desiredEntryCount, entriesOf, entrySummary, estimateMinutes, removeEntry, screeningPayload, validateAll, validateQuestion,
} from "@/questionnaires/logic";
import { initialState, reducer } from "@/questionnaires/reducer";
import { buildSubmitPayload, MemorySessionStore, MockClientSessionAdapter, MockRequestsAdapter, MockSubmitAdapter, buildLeadPayload, disabledSubmitAdapter, MAX_CODE_ATTEMPTS } from "@/questionnaires/adapters";
import { buildView, maskId, toCsv, toJsonExport, toPlainText, formatValue } from "@/questionnaires/format";
import { fuzzyRank, normalizeHe, searchBanks, searchBranches, searchCities, searchStreets, shortBankName, levenshtein } from "@/questionnaires/refdata";

const load = (k: string) => QuestionnaireSchema.parse(JSON.parse(fs.readFileSync(path.resolve("src/data/questionnaires", `${k}.json`), "utf8"))) as Questionnaire;
const health = load("health");
const personalExt = load("personal-extended");
const dd = load("direct-debit");

describe("conditions", () => {
  it("string, array, multi", () => {
    expect(conditionMet({ id: "a", value: "כן" }, { a: "כן" })).toBe(true);
    expect(conditionMet({ id: "a", value: "כן" }, { a: "לא" })).toBe(false);
    expect(conditionMet({ id: "a", value: ["x", "y"] }, { a: "y" })).toBe(true);
    expect(conditionMet({ id: "a", value: "x" }, { a: ["w", "x"] })).toBe(true);
    expect(conditionMet({ id: "a", value: "x" }, {})).toBe(false);
    expect(conditionMet({ id: "a", value: "x" }, { a: UNKNOWN })).toBe(false);
    expect(conditionMet(null, {})).toBe(true);
  });
});

describe("visibility without screening (personal-extended)", () => {
  it("id type switches the id field", () => {
    const k = (a: Answers) => [...computeFlow(personalExt, a).visible];
    expect(k({ id_type: "תעודת זהות ישראלית" })).toContain("identity_document");
    expect(k({ id_type: "תעודת זהות ישראלית" })).not.toContain("passport_number");
    expect(k({ id_type: "דרכון" })).toContain("passport_number");
  });
  it("marital status opens the spouse group (transitively)", () => {
    const v = (a: Answers) => computeFlow(personalExt, a).visible;
    expect(v({ family: "רווק/ה", has_spouse: "כן" }).has("spouse")).toBe(false);
    expect(v({ family: "רווק/ה" }).has("has_spouse")).toBe(false);
    expect(v({ family: "נשוי/אה" }).has("has_spouse")).toBe(true);
    expect(v({ family: "נשוי/אה", has_spouse: "כן" }).has("spouse")).toBe(true);
    expect(v({ family: "ידוע/ה בציבור", has_spouse: "לא" }).has("spouse")).toBe(false);
  });
  it("employment opens the matching groups", () => {
    const v = (a: Answers) => computeFlow(personalExt, a).visible;
    expect(v({ employment: "שכיר/ה" }).has("employers")).toBe(true);
    expect(v({ employment: "שכיר/ה" }).has("self_employment")).toBe(false);
    expect(v({ employment: "עצמאי/ת" }).has("self_employment")).toBe(true);
    expect(v({ employment: "שכיר/ה ועצמאי/ת" }).has("employers") && v({ employment: "שכיר/ה ועצמאי/ת" }).has("self_employment")).toBe(true);
    expect(v({ employment: "גמלאי/ת" }).has("previous_occupation")).toBe(true);
    expect(v({ employment: "סטודנט/ית" }).has("employers")).toBe(false);
    expect(personalExt.sections.flatMap((s) => s.questions).find((q) => q.key === "employment")!.options).toEqual(expect.arrayContaining(["סטודנט/ית", "חייל/ת או שירות לאומי"]));
  });
  it("children count drives the repeat group size", () => {
    const q = personalExt.sections.flatMap((s) => s.questions).find((x) => x.key === "children")!;
    expect(desiredEntryCount(q, { children_count: "3" })).toBe(3);
    expect(desiredEntryCount(q, { children_count: "x" })).toBeNull();
    expect(computeFlow(personalExt, { has_children: "כן" }).visible.has("children_count")).toBe(true);
    expect(computeFlow(personalExt, { has_children: "לא" }).visible.has("children")).toBe(false);
  });
});

describe("repeat groups", () => {
  const q = personalExt.sections.flatMap((s) => s.questions).find((x) => x.key === "children")!;
  it("add / remove", () => {
    let v = addEntry(undefined, q);
    v = addEntry(v, q);
    expect(entriesOf(v)).toHaveLength(2);
    expect(entriesOf(removeEntry(v, 0))).toHaveLength(1);
  });
  it("max entries", () => {
    const one = { ...q, meta: { ...q.meta, maxEntries: 1 } };
    expect(entriesOf(addEntry(addEntry(undefined, one), one))).toHaveLength(1);
  });
  it("child must be born after the parent; spouse id differs from client", () => {
    const answers: Answers = { identity_document: "123456782", birth: "1990-01-01" };
    const r = validateQuestion(q, [{ first_name: "דנה", last_name: "כהן", id_type: "דרכון", passport: "AB123456", passport_country: "x", birth: "1985-01-01", gender: "נקבה" }], { answers, now: new Date(2026, 10, 17) });
    expect(r.ok).toBe(false);
    expect(r.entryErrors?.[0]?.birth).toBeTruthy();
    const sp = personalExt.sections.flatMap((s) => s.questions).find((x) => x.key === "spouse")!;
    const r2 = validateQuestion(sp, [{ first_name: "דנה", last_name: "כהן", id_type: "תעודת זהות ישראלית", id_number: "123456782" }], { answers });
    expect(r2.entryErrors?.[0]?.id_number).toMatch(/זהה/);
  });
  it("summary chip", () => {
    expect(entrySummary(q, { first_name: "דנה", last_name: "כהן", birth: "2015-01-01" })).toContain("קטין/ה");
  });
});

describe("validateQuestion", () => {
  const find = (k: string) => personalExt.sections.flatMap((s) => s.questions).find((q) => q.key === k)!;
  it("required vs unknown", () => {
    expect(validateQuestion(find("first_name"), "", { answers: {} }).ok).toBe(false);
    expect(validateQuestion(find("birth_country"), UNKNOWN, { answers: {} }).ok).toBe(true); // allow_unknown
    expect(validateQuestion(find("first_name"), UNKNOWN, { answers: {} }).ok).toBe(false); // not allowed
    expect(validateQuestion(find("previous_last_name"), "", { answers: {} }).ok).toBe(true); // optional
  });
  it("format dispatch", () => {
    expect(validateQuestion(find("identity_document"), "123456783", { answers: {} }).ok).toBe(false);
    expect(validateQuestion(find("identity_document"), "123456782", { answers: {} }).ok).toBe(true);
    expect(validateQuestion(find("contact_phone"), "052-3097444", { answers: {} }).value).toBe("0523097444");
    expect(validateQuestion(find("birth"), "2999-01-01", { answers: {} }).ok).toBe(false);
    expect(validateQuestion(find("address_postal_code"), "123", { answers: {} }).ok).toBe(false);
  });
  it("direct debit bank block: bank by name, branch, account, holder (first + last name), holder id", () => {
    const d = (k: string) => dd.sections.flatMap((x) => x.questions).find((q) => q.key === k)!;
    const v = (k: string, val: string) => validateQuestion(d(k), val, { answers: {} });
    expect(v("dd_bank", "הפועלים").ok).toBe(false); // must pick from the list
    expect(v("dd_bank", "בנק הפועלים (12)").ok).toBe(true);
    expect(v("dd_branch", "600").ok).toBe(true);
    expect(v("dd_branch", "6000").ok).toBe(false);
    expect(v("dd_account", "12").ok).toBe(false);
    expect(v("dd_account", "123-456").value).toBe("123456");
    expect(v("dd_holder_name", "דנה").ok).toBe(false);
    expect(v("dd_holder_name", "דנה כהן").ok).toBe(true);
    expect(v("dd_holder_name", "Anne Marie").ok).toBe(true);
    expect(v("dd_holder_id", "123456783").ok).toBe(false);
    expect(v("dd_holder_id", "123456782").ok).toBe(true);
    expect(dd.sections.flatMap((x) => x.questions).some((x) => /iban/i.test(x.key))).toBe(false); // no IBAN in the flow
    expect(d("dd_authorisation").type).toBe("consent");
    // the block only shows when the payment means is a bank account
    expect(computeFlow(dd, { payment_choice: "אמצעי אחר" }).visible.has("dd_bank")).toBe(false);
    expect(computeFlow(dd, { payment_choice: "חשבון בנק" }).visible.has("dd_bank")).toBe(true);
  });
});

// ---------------------------------------------------------------- screening -> follow-up modules
describe("screening: gates and follow-up modules (health)", () => {
  const gates = health.screening!.gates;
  const gateKeys = gates.map((g) => g.key);
  const sectionOfGate = (k: string) => gates.find((g) => g.key === k)!.sectionId;
  const allNo = (): Answers => Object.fromEntries(gateKeys.map((k) => [k, "לא"]));
  const cardio = "medical_cardiovascular";
  const skin = "medical_skin";

  it("definition: every body system has a gate; counts", () => {
    expect(gateKeys.length).toBeGreaterThanOrEqual(25);
    expect(gateKeys).toContain(cardio);
    expect(new Set(gateKeys).size).toBe(gateKeys.length);
  });
  it("incomplete until every visible gate is answered", () => {
    expect(computeFlow(health, {}).screening!.status).toBe("incomplete");
    const a = allNo();
    delete a[cardio];
    expect(computeFlow(health, a).screening!.status).toBe("incomplete");
  });
  it("all NO -> all_clear, no follow-up questions, explicit derived field", () => {
    const f = computeFlow(health, allNo());
    expect(f.screening!.status).toBe("all_clear");
    expect(f.screening!.openedModules).toEqual([]);
    expect(f.steps.some((s) => s.phase === "module")).toBe(false);
    const p = screeningPayload(health, allNo(), "2026-11-17T10:00:00Z")!;
    expect(p).toMatchObject({ status: "all_clear", answeredAt: "2026-11-17T10:00:00Z", version: health.version, openedModules: [] });
    const pay = buildSubmitPayload({ def: health, answers: allNo(), mode: "client-link", sessionId: "s1", stepKey: null, submit: true });
    expect(pay.derived.health_screening).toMatchObject({ status: "all_clear" });
  });
  it("one YES -> exactly one module opens, with its detail questions", () => {
    const a = { ...allNo(), [cardio]: "כן" };
    const f = computeFlow(health, a);
    expect(f.screening!.status).toBe("follow_up");
    expect(f.screening!.openedModules).toEqual([sectionOfGate(cardio)]);
    const modSteps = f.steps.filter((s) => s.phase === "module");
    expect(modSteps.length).toBeGreaterThan(0);
    expect(new Set(modSteps.map((s) => s.sectionId))).toEqual(new Set([sectionOfGate(cardio)]));
    // the module's own sub-gates open details only after they are answered yes
    expect(f.visible.has("medical_cardiovascular_bp")).toBe(true);
    expect(f.visible.has("medical_cardiovascular_bp_detail_1")).toBe(false);
    const f2 = computeFlow(health, { ...a, medical_cardiovascular_bp: "כן" });
    expect(f2.visible.has("medical_cardiovascular_bp_detail_1")).toBe(true);
  });
  it("flip back to NO removes the module but keeps typed answers recoverable", () => {
    const yes = { ...allNo(), [cardio]: "כן", medical_cardiovascular_bp: "כן", medical_cardiovascular_bp_detail_1: "טקסט שהוקלד" };
    expect(computeFlow(health, yes).visible.has("medical_cardiovascular_bp_detail_1")).toBe(true);
    const flipped = { ...yes, [cardio]: "לא" };
    const f = computeFlow(health, flipped);
    expect(f.screening!.status).toBe("all_clear");
    expect(f.visible.has("medical_cardiovascular_bp_detail_1")).toBe(false);
    expect(flipped.medical_cardiovascular_bp_detail_1).toBe("טקסט שהוקלד"); // still in state
    const back = computeFlow(health, { ...flipped, [cardio]: "כן" });
    expect(back.visible.has("medical_cardiovascular_bp_detail_1")).toBe(true);
    // hidden answers never reach the payload
    const pay = buildSubmitPayload({ def: health, answers: flipped, mode: "agent", sessionId: "s", stepKey: null, submit: false });
    expect(Object.keys(pay.fields)).not.toContain("medical_cardiovascular_bp_detail_1");
  });
  it("two YES -> two modules in stable definition order, regardless of answer order", () => {
    const a = { ...allNo(), [skin]: "כן", [cardio]: "כן" };
    const f = computeFlow(health, a);
    const order = health.sections.filter((s) => s.module).map((s) => s.id);
    const opened = f.screening!.openedModules;
    expect(opened).toHaveLength(2);
    expect(opened).toEqual(order.filter((id) => opened.includes(id)));
    const b: Answers = { ...allNo() };
    b[skin] = "כן"; b[cardio] = "כן";
    expect(computeFlow(health, b).screening!.openedModules).toEqual(opened);
  });
  it("reasons list the ticked gates (for the 'why was this opened' screen)", () => {
    const f = computeFlow(health, { ...allNo(), [cardio]: "כן" });
    const m = f.screening!.modules.find((x) => x.open)!;
    expect(m.reasons.map((r) => r.key)).toEqual([cardio]);
  });
  it("gates are yes/no only: no unknown option, an unknown answer is invalid and the screening stays incomplete", () => {
    for (const g of gates) {
      const q = health.sections.flatMap((s) => s.questions).find((x) => x.key === g.key)!;
      expect(q.options).toEqual(["כן", "לא"]);
      expect(q.allow_unknown).toBe(false);
    }
    const q = health.sections.flatMap((s) => s.questions).find((x) => x.key === cardio)!;
    expect(validateQuestion(q, UNKNOWN, { answers: {} }).ok).toBe(false);
    expect(computeFlow(health, { ...allNo(), [cardio]: UNKNOWN }).screening!.status).toBe("incomplete");
  });
  it("detail questions inside a module may still allow 'לא יודע/ת'", () => {
    const q = health.sections.flatMap((s) => s.questions).find((x) => x.key === "medical_cardiovascular_bp")!;
    expect(q.meta.gate).toBeUndefined();
    expect(q.options).toContain("לא יודע/ת");
  });
  it("ex-smoker path: smoking no -> smoking_past gate; yes opens the lifestyle module", () => {
    const a = { ...allNo(), smoking: "לא", smoking_past: "כן" };
    const f = computeFlow(health, a);
    expect(f.screening!.status).toBe("follow_up");
    expect(f.visible.has("smoking_quit_year")).toBe(true);
  });
  it("general questions (height/weight) come first; gates form one screening phase before modules", () => {
    const f = computeFlow(health, { ...allNo(), [cardio]: "כן" });
    const phases = f.steps.map((s) => s.phase);
    expect(phases.indexOf("general")).toBe(0);
    expect(phases.lastIndexOf("general")).toBeLessThan(phases.indexOf("screening"));
    expect(phases.lastIndexOf("screening")).toBeLessThan(phases.indexOf("module"));
  });
  it("validateAll on an empty screening points at the first gate", () => {
    const r = validateAll(health, {});
    expect(r.firstKey).toBe("height");
  });
  it("health estimate is minutes, not an hour", () => expect(estimateMinutes(health)).toBeLessThan(15));
});

describe("progress", () => {
  it("counts answered over visible, per section", () => {
    const f = computeFlow(personalExt, { first_name: "דנה" });
    const p = computeProgress(f, { first_name: "דנה" }, "first_name");
    expect(p.answered).toBe(1);
    expect(p.total).toBe(f.steps.length);
    expect(p.sections[0].current).toBe(true);
  });
});

describe("reducer", () => {
  it("answer clears the error while typing; touch sets it; back/goto", () => {
    let s = initialState("personal", "agent", false);
    s = reducer(s, { type: "start", firstKey: "a" });
    s = reducer(s, { type: "touch", key: "a", error: "שגיאה" });
    expect(s.errors.a).toBe("שגיאה");
    s = reducer(s, { type: "answer", key: "a", value: "x" });
    expect(s.errors.a).toBeUndefined();
    s = reducer(s, { type: "goto", key: "b" });
    s = reducer(s, { type: "goto", key: "c" });
    s = reducer(s, { type: "back" });
    expect(s.currentKey).toBe("b");
  });
  it("health starts on consent; consent moves on; clear resets everything incl. consent", () => {
    let s = initialState("health", "agent", true);
    expect(s.phase).toBe("consent");
    s = reducer(s, { type: "consent" });
    s = reducer(s, { type: "answer", key: "x", value: "כן" });
    s = reducer(s, { type: "clear", needsConsent: true, firstKey: null });
    expect(s.phase).toBe("consent");
    expect(s.answers).toEqual({});
  });
});

describe("adapters", () => {
  it("store: memory + session, clear", () => {
    const st = new MemorySessionStore(true);
    st.save("k", { answers: { a: "1" }, currentKey: "a", consented: true, updatedAt: "x", version: 1 });
    expect(st.load("k")?.answers.a).toBe("1");
    st.clear("k");
    expect(st.load("k")).toBeNull();
    st.save("k2", { answers: {}, currentKey: null, consented: false, updatedAt: "x", version: 1 });
    st.clearAll();
    expect(st.load("k2")).toBeNull();
  });
  it("default submit adapter is a disabled no-op", async () => {
    expect(disabledSubmitAdapter.enabled).toBe(false);
    expect((await disabledSubmitAdapter.saveStep({} as never)).status).toBe("disabled");
  });
  it("payload: idempotency key is stable and fields carry source + rank 4", () => {
    const answers = { first_name: "דנה" };
    const a = buildSubmitPayload({ def: load("personal"), answers, mode: "agent", sessionId: "s1", stepKey: "first_name", submit: false });
    const b = buildSubmitPayload({ def: load("personal"), answers, mode: "agent", sessionId: "s1", stepKey: "first_name", submit: false });
    expect(a.idempotencyKey).toBe(b.idempotencyKey);
    expect(a.questionnaire).toEqual({ key: "personal", version: 1 });
    expect(a.fields.first_name).toMatchObject({ source: "pre_treatment_questionnaire", rank: 4 });
    const c = buildSubmitPayload({ def: load("personal"), answers: { first_name: "דנה", last_name: "כהן" }, mode: "agent", sessionId: "s1", stepKey: "last_name", submit: false });
    expect(c.idempotencyKey).not.toBe(a.idempotencyKey);
  });
  it("mock submit: duplicates are recognised", async () => {
    const m = new MockSubmitAdapter();
    const p = buildSubmitPayload({ def: load("personal"), answers: { first_name: "דנה" }, mode: "agent", sessionId: "s", stepKey: "first_name", submit: false });
    expect((await m.saveStep(p)).status).toBe("saved");
    expect((await m.saveStep(p)).status).toBe("duplicate");
  });
  it("requests + client session: create, open with code, resume, lockout, revoke, expiry", async () => {
    const req = new MockRequestsAdapter();
    const ses = new MockClientSessionAdapter(req);
    const { request, code, url } = await req.create({ questionnaireKey: "personal", customerRef: "ref-1", expiresInDays: 7 });
    expect(url).toContain(`/q/${request.token}`);
    expect(code).toMatch(/^\d{6}$/);
    const bad = await ses.open(request.token, "000000");
    expect(bad.ok).toBe(false);
    const ok = await ses.open(request.token, code);
    expect(ok.ok).toBe(true);
    const pay = buildSubmitPayload({ def: load("personal"), answers: { first_name: "דנה" }, mode: "client-link", sessionId: "s", stepKey: "first_name", submit: false, requestToken: request.token });
    expect((await ses.saveStep(request.token, pay)).status).toBe("saved");
    const again = await ses.open(request.token, code);
    expect((again as { resume?: { answers: Answers } }).resume?.answers.first_name).toBe("דנה");
    expect((again as { resume?: { stepKey: string } }).resume?.stepKey).toBe("first_name");
    // lockout
    const r2 = await req.create({ questionnaireKey: "personal", customerRef: "ref-2", expiresInDays: 1 });
    let last;
    for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) last = await ses.open(r2.request.token, "111111");
    expect((last as { error?: string }).error).toBe("locked");
    expect((await ses.open(r2.request.token, r2.code)).ok).toBe(false);
    const re = await req.resend(r2.request.id);
    expect(re.code).not.toBe(r2.code);
    // revoke
    await req.revoke(request.id);
    const rv = await ses.open(request.token, code);
    expect((rv as { error?: string }).error).toBe("revoked");
    expect((await req.list()).length).toBe(2);
  });
  it("lead payload matches save_lead shape", () => {
    const p = buildLeadPayload({ firstName: "דנה", phone: "0523097444", topics: ["pension"], note: "", consent: true }, "s");
    expect(p).toMatchObject({ p_line_of_business: "finance", origin: "meeting", p_national_id: null });
    expect(p.p_fields).toEqual({ first_name: "דנה", contact_phone: "0523097444", lead_topics: "pension" });
    expect(p.p_idempotency_key).toMatch(/^lead:meeting:/);
  });
});

describe("response formatters", () => {
  const def = load("personal");
  const answers: Answers = { first_name: "דנה", last_name: "כהן", id_type: "תעודת זהות ישראלית", identity_document: "123456782", birth: "1990-05-07", contact_phone: "0523097444", contact_email: "a@b.co", birth_country: UNKNOWN };
  const view = buildView(def, answers);
  it("groups by section, formats dates / phones", () => {
    expect(view[0].title).toBe("הצטרפות · פרטים אישיים");
    const flat = view.flatMap((s) => s.rows);
    expect(flat.find((r) => r.key === "birth")!.text).toBe("07/05/1990");
    expect(flat.find((r) => r.key === "contact_phone")!.text).toBe("052-3097444");
    expect(flat.find((r) => r.key === "birth_country")!.text).toBe("לא יודע/ת");
  });
  it("masks ids on request", () => {
    expect(maskId("123456782")).toBe("••••••782");
    const m = buildView(def, answers, { maskIds: true }).flatMap((s) => s.rows).find((r) => r.key === "identity_document")!;
    expect(m.text).toBe("••••••782");
  });
  it("plain text is label: value lines", () => {
    const t = toPlainText(def, view);
    expect(t).toContain("שם פרטי כפי שמופיע במסמך המזהה: דנה");
    expect(t.startsWith("פרטים אישיים")).toBe(true);
  });
  it("csv escapes quotes, commas, newlines and formula starts", () => {
    const csv = toCsv([{ id: "s", title: "פרק", rows: [{ key: "k", label: 'שאלה, עם "ציטוט"', text: "=SUM(A1)", raw: "x", sectionTitle: "פרק" }] }]);
    expect(csv.split("\r\n")[1]).toBe('פרק,k,"שאלה, עם ""ציטוט""",\'=SUM(A1)');
  });
  it("json export is valid and keyed", () => {
    const j = JSON.parse(toJsonExport(def, view, new Date("2026-11-17T00:00:00Z")));
    expect(j.questionnaire.key).toBe("personal");
    expect(j.fields.first_name.value).toBe("דנה");
    expect(j.exportedAt).toBe("2026-11-17T00:00:00.000Z");
  });
  it("repeat values read as numbered lines; money and percent", () => {
    const cq = personalExt.sections.flatMap((s) => s.questions).find((q) => q.key === "children")!;
    expect(formatValue(cq, [{ first_name: "נועם", last_name: "כהן" }])).toMatch(/^1\. /);
    const money = personalExt.sections.flatMap((s) => s.questions).find((q) => q.key === "monthly_income")!;
    expect(formatValue(money, "12000")).toBe("12,000 ₪");
  });
});

describe("reference matching", () => {
  const cities = [{ code: 5000, name: "תל אביב -יפו" }, { code: 3000, name: "ירושלים" }, { code: 6100, name: "בני ברק" }, { code: 70, name: "אשדוד" }, { code: 8300, name: "ראשון לציון" }];
  it("normalises niqqud, quotes, final letters", () => {
    expect(normalizeHe("ירוּשָׁלַיִם")).toBe(normalizeHe("ירושלים"));
    expect(normalizeHe('ג\'וליס')).toBe(normalizeHe("ג וליס"));
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
  it("prefix, typo suggestions", () => {
    expect(searchCities(cities, "ירוש")[0].item.name).toBe("ירושלים");
    expect(searchCities(cities, "ירושלם")[0].item.name).toBe("ירושלים"); // typo
    expect(searchCities(cities, "אשדוד")[0].exact).toBe(true);
    expect(searchCities(cities, "xyz")).toEqual([]);
  });
  it("street aliases resolve to the official name", () => {
    const streets: [number, string, ...string[]][] = [[1, "הרצל"], [2, "ז'בוטינסקי", "ז׳בוטינסקי ישן", "ג'בוטינסקי"], [3, "רוטשילד"]];
    const r = searchStreets(streets, "ג'בוטינסקי");
    expect(r[0].item[1]).toBe("ז'בוטינסקי");
    expect(searchStreets(streets, "רוטשלד")[0].item[1]).toBe("רוטשילד");
  });
  it("banks by name or number; branches by number or name", () => {
    const banks = [{ code: 12, name: 'בנק הפועלים בע"מ' }, { code: 10, name: 'בנק לאומי לישראל בע"מ' }];
    expect(searchBanks(banks, "12")[0].item.code).toBe(12);
    expect(searchBanks(banks, "לאומי")[0].item.code).toBe(10);
    expect(shortBankName(banks[0].name)).toBe("בנק הפועלים");
    const br: [number, number, string, string, string, string][] = [[12, 600, "ראשי", "תל אביב", "הרצל 1", "רגיל"], [12, 211, "רמת גן", "רמת גן", "ז'בוטינסקי 3", "רגיל"]];
    expect(searchBranches(br, "211")[0].item[1]).toBe(211);
    expect(searchBranches(br, "רמת")[0].item[1]).toBe(211);
    expect(fuzzyRank(br, "", (r) => [r[2]])).toEqual([]);
  });
});
