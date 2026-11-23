// The steps of the client flow that are not the questionnaire Runner: identity (once per session), documents (after the
// personal questionnaire), the risk quiz wrapper and the card's closing screen.
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdSpot } from "@/components/sd/SdSpot";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { useTurnstileToken } from "@/pages/report-order/useTurnstileToken";
import { validateEmail, validateIsraeliId, validateIsraeliPhone, validatePersonName } from "@/questionnaires/validators";
import { hashPayload } from "@/questionnaires/hash";
import RiskQuiz from "@/components/risk/RiskQuiz";
import type { RiskResult } from "@/lib/riskProfile";
import { RISK_LEVEL_COPY } from "@/data/riskProfile";
import { errorKindOf, type DocumentReq, type FormsApi, type StartReq } from "@/forms/api";
import { CARD_STATUS_LABEL, cardPath, cardStatus, DOCUMENT_LABELS, nextCardAfter, RISK_QUESTIONNAIRE_KEY, type DocumentKind, type FormsCard, type SubmissionSummary } from "@/forms/catalog";
import { FORMS_LIMITS } from "@/forms/config";

// ---------------------------------------------------------------- identity (once)
interface Identity { first: string; last: string; id: string; phone: string; email: string; terms: boolean }
const EMPTY: Identity = { first: "", last: "", id: "", phone: "", email: "", terms: false };

function Field({ id, label, value, onChange, err, ltr, type = "text", inputMode, autoComplete, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; err?: string; ltr?: boolean;
  type?: "text" | "tel" | "email"; inputMode?: "numeric" | "email" | "text"; autoComplete?: string; hint?: string;
}) {
  return (
    <div className="sd-q-subfield">
      <label htmlFor={`forms-${id}`} className="sd-q-sublabel">{label}</label>
      <input id={`forms-${id}`} className="sd-q-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} autoComplete={autoComplete}
        dir={ltr ? "ltr" : undefined} style={ltr ? { textAlign: "right" } : undefined} aria-invalid={err ? true : undefined} aria-describedby={err ? `forms-${id}-err` : hint ? `forms-${id}-hint` : undefined} />
      {hint && !err && <p id={`forms-${id}-hint`} className="sd-q-fine">{hint}</p>}
      {err && <p id={`forms-${id}-err`} className="sd-q-error" role="alert">{err}</p>}
    </div>
  );
}

export function IdentityStep({ api, card, onStarted, onFail }: { api: FormsApi; card: FormsCard; onStarted: () => void; onFail: (kind: ReturnType<typeof errorKindOf>) => void }) {
  const [d, setD] = useState<Identity>(EMPTY);
  const [errs, setErrs] = useState<Partial<Record<keyof Identity, string>>>({});
  const [busy, setBusy] = useState(false);
  const turnstile = useTurnstileToken();
  const set = (patch: Partial<Identity>) => { setD((cur) => ({ ...cur, ...patch })); setErrs({}); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const first = validatePersonName(d.first, { min: 2, max: 80 });
    const last = validatePersonName(d.last, { min: 2, max: 80 });
    const id = validateIsraeliId(d.id);
    const phone = validateIsraeliPhone(d.phone);
    const email = d.email.trim() ? validateEmail(d.email) : { ok: true as const, value: "" };
    const next: typeof errs = {};
    if (!first.ok) next.first = first.message;
    if (!last.ok) next.last = last.message;
    if (!id.ok) next.id = id.message;
    if (!phone.ok) next.phone = phone.message;
    if (!email.ok) next.email = email.message;
    if (!d.terms) next.terms = "כדי להמשיך צריך לאשר את תנאי השימוש ומדיניות הפרטיות";
    setErrs(next);
    const firstErr = (["first", "last", "id", "phone", "email", "terms"] as const).find((k) => next[k]);
    if (firstErr) { document.getElementById(`forms-${firstErr}`)?.focus(); return; }
    setBusy(true);
    try {
      const turnstile_token = await turnstile.waitForToken();
      const req: StartReq = { first_name: first.value!, last_name: last.value!, national_id: id.value!, phone: phone.value!, email: email.value || null, terms_privacy_approved: true, turnstile_token };
      await api.start(req);
      setD(EMPTY);
      onStarted();
    } catch (err) {
      onFail(errorKindOf(err));
    } finally {
      turnstile.reset();
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <section className="sd-q-card sd-q-step" aria-labelledby="forms-id-h">
        <SdSpot name="passport" size={84} className="sd-q-spot" />
        <h2 id="forms-id-h" className="sd-q-qtitle" tabIndex={-1} ref={(el) => el?.focus({ preventScroll: true })}>כמה פרטי זיהוי, פעם אחת</h2>
        <p className="sd-q-p">כדי שנדע של מי השאלונים ונוכל לחזור אליכם. אחרי זה עוברים ל{card.title} וממשיכים לשאלונים הבאים בלי למלא שוב.</p>
        <div className="sd-forms-fields">
          <Field id="first" label="שם פרטי" value={d.first} onChange={(first) => set({ first })} err={errs.first} autoComplete="given-name" />
          <Field id="last" label="שם משפחה" value={d.last} onChange={(last) => set({ last })} err={errs.last} autoComplete="family-name" />
          <Field id="id" label="מספר תעודת זהות" value={d.id} onChange={(id) => set({ id })} err={errs.id} ltr inputMode="numeric" autoComplete="off" hint="9 ספרות. נשמר אצלנו מוצפן." />
          <Field id="phone" label="טלפון נייד" value={d.phone} onChange={(phone) => set({ phone })} err={errs.phone} ltr type="tel" inputMode="numeric" autoComplete="tel" />
          <Field id="email" label="דוא״ל (לא חובה)" value={d.email} onChange={(email) => set({ email })} err={errs.email} ltr type="email" inputMode="email" autoComplete="email" />
        </div>
        <div className="sd-poa-check">
          <label className={`sd-q-choice is-check ${d.terms ? "is-on" : ""}`}>
            <input id="forms-terms" type="checkbox" checked={d.terms} onChange={(e) => set({ terms: e.target.checked })} aria-invalid={errs.terms ? true : undefined} aria-describedby={errs.terms ? "forms-terms-err" : undefined} />
            <span>קראתי ואני מאשר/ת את <a href="/terms" target="_blank" rel="noopener noreferrer">תנאי השימוש</a> ואת <a href="/privacy" target="_blank" rel="noopener noreferrer">מדיניות הפרטיות</a></span>
          </label>
          {errs.terms && <p id="forms-terms-err" className="sd-q-error" role="alert">{errs.terms}</p>}
        </div>
        {turnstile.widget && (
          <div style={{ marginTop: 12 }}>
            <TurnstileWidget ref={turnstile.widget.handle} siteKey={turnstile.widget.siteKey} onToken={turnstile.widget.onToken} onError={turnstile.widget.onError} />
          </div>
        )}
        <p className="sd-q-fine">הפרטים נשמרים מוצפנים ומשמשים את הצוות לטיפול בבקשה בלבד.</p>
      </section>
      <div className="sd-rk-bar sd-poa-bar" role="toolbar" aria-label="ניווט">
        <Link to="/forms" className="sd-q-btn is-quiet">לכל השאלונים</Link>
        <button type="submit" className="sd-q-btn" disabled={busy} aria-busy={busy || undefined}>{busy ? "רגע…" : "ממשיכים"}{!busy && <BrandIcon name="arrow-left" size={18} />}</button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- documents
const EXT_OF: Record<string, DocumentReq["ext"]> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/heic": "heic" };
function extOfFile(f: File): DocumentReq["ext"] | null {
  const byType = EXT_OF[f.type.toLowerCase()];
  if (byType) return byType;
  const m = /\.(pdf|jpe?g|png|heic)$/i.exec(f.name);
  if (!m) return null;
  const e = m[1].toLowerCase();
  return e === "jpeg" ? "jpg" : (e as DocumentReq["ext"]);
}
const CONTENT_TYPE: Record<DocumentReq["ext"], string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic" };

function toBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

export function DocumentsStep({ api, card, uploaded, onUploaded, onDone, onFail }: {
  api: FormsApi; card: FormsCard; uploaded: { kind: string }[]; onUploaded: () => void; onDone: () => void; onFail: (kind: ReturnType<typeof errorKindOf>) => void;
}) {
  const [busy, setBusy] = useState<DocumentKind | null>(null);
  const [msg, setMsg] = useState<Partial<Record<DocumentKind, string>>>({});
  const inputs = useRef<Partial<Record<DocumentKind, HTMLInputElement | null>>>({});
  const count = (k: DocumentKind) => uploaded.filter((d) => d.kind === k).length;

  const pick = async (kind: DocumentKind, file: File | undefined) => {
    if (!file) return;
    const ext = extOfFile(file);
    if (!ext) { setMsg((m) => ({ ...m, [kind]: "אפשר להעלות PDF או תמונה (JPG, PNG, HEIC)." })); return; }
    if (file.size > FORMS_LIMITS.documentMaxBytes) { setMsg((m) => ({ ...m, [kind]: "הקובץ גדול מדי. עד 6 MB לקובץ." })); return; }
    setBusy(kind);
    setMsg((m) => ({ ...m, [kind]: "מעלים…" }));
    try {
      await api.document({ kind, ext, content_type: CONTENT_TYPE[ext], bytes_base64: await toBase64(file) });
      setMsg((m) => ({ ...m, [kind]: "התקבל." }));
      onUploaded();
    } catch (e) {
      const k = errorKindOf(e);
      if (k === "expired" || k === "inactive" || k === "locked") { onFail(k); return; }
      setMsg((m) => ({ ...m, [kind]: "ההעלאה לא הצליחה. אפשר לנסות שוב, או להעביר לנו את המסמך בדרך אחרת." }));
    } finally {
      setBusy(null);
      const input = inputs.current[kind];
      if (input) input.value = "";
    }
  };

  return (
    <>
      <section className="sd-q-card sd-q-step" aria-labelledby="forms-docs-h">
        <SdSpot name="scroll-ribbon" size={84} className="sd-q-spot" />
        <h2 id="forms-docs-h" className="sd-q-qtitle" tabIndex={-1} ref={(el) => el?.focus({ preventScroll: true })}>מסמכים שכדאי שיהיו אצלנו</h2>
        <p className="sd-q-p">מצלמים בטלפון או מעלים קובץ. הכול לא חובה, ואפשר להשלים אחר כך.</p>
        <ul className="sd-forms-docs">
          {card.documents.map((k) => {
            const n = count(k);
            return (
              <li key={k} className={`sd-forms-doc ${n > 0 ? "is-done" : ""}`}>
                <strong>{DOCUMENT_LABELS[k]}</strong>
                <small>{n > 0 ? `${n} ${n === 1 ? "קובץ התקבל" : "קבצים התקבלו"}` : "PDF או תמונה, עד 6 MB"}</small>
                <input ref={(el) => { inputs.current[k] = el; }} id={`forms-doc-${k}`} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,application/pdf,image/jpeg,image/png,image/heic" onChange={(e) => void pick(k, e.target.files?.[0])} disabled={busy !== null} />
                <label htmlFor={`forms-doc-${k}`} className="sd-q-btn is-quiet" aria-disabled={busy !== null || undefined}>{busy === k ? "מעלים…" : n > 0 ? "להוסיף עוד" : "בחירת קובץ"}</label>
                {msg[k] && <p className="sd-q-fine" role="status" style={{ flexBasis: "100%", margin: 0 }}>{msg[k]}</p>}
              </li>
            );
          })}
        </ul>
      </section>
      <div className="sd-rk-bar sd-poa-bar" role="toolbar" aria-label="ניווט">
        <Link to="/forms" className="sd-q-btn is-quiet">לכל השאלונים</Link>
        <button type="button" className="sd-q-btn" onClick={onDone} disabled={busy !== null}>{uploaded.length ? "סיימתי" : "אמשיך בלי מסמכים"}<BrandIcon name="arrow-left" size={18} /></button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- risk quiz
export function RiskStep({ api, card, onSubmitted, onFail }: { api: FormsApi; card: FormsCard; onSubmitted: () => void; onFail: (kind: ReturnType<typeof errorKindOf>) => void }) {
  const [sent, setSent] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const lastRef = useRef<RiskResult | null>(null);
  const onResult = async (r: RiskResult | null) => {
    if (!r || sent === "sending" || sent === "sent") { lastRef.current = r; return; }
    lastRef.current = r;
    setSent("sending");
    try {
      const answers = { level: r.level, base_level: r.baseLevel, guardrail: r.guardrail ?? "" };
      const hash = await hashPayload({ q: { key: RISK_QUESTIONNAIRE_KEY, version: 1 }, fields: answers });
      await api.submit({ card: card.key, questionnaire: RISK_QUESTIONNAIRE_KEY, version: 1, answers, derived: { risk_level: r.level, risk_label: RISK_LEVEL_COPY[r.level].title }, signer: { name: "", kind: "none", hash }, completion: 100 });
      setSent("sent");
      onSubmitted();
    } catch (e) {
      const k = errorKindOf(e);
      if (k === "expired" || k === "inactive" || k === "locked") { onFail(k); return; }
      setSent("error");
    }
  };
  return (
    <div className="sd-forms-risk">
      <RiskQuiz onResult={(r) => void onResult(r)} />
      {sent === "sent" && <p className="sd-q-fine" role="status">התוצאה נשמרה אצלנו.</p>}
      {sent === "error" && <p className="sd-q-fine" role="status">התוצאה לא נשמרה אצלנו הפעם. אפשר לענות שוב, או לספר לנו בשיחה.</p>}
    </div>
  );
}

// ---------------------------------------------------------------- closing screen of a card
export function CardDone({ card, submissions }: { card: FormsCard; submissions: readonly SubmissionSummary[] }) {
  const next = useMemo(() => nextCardAfter(card.key, submissions), [card.key, submissions]);
  const st = cardStatus(card, submissions);
  return (
    <section className="sd-q-card sd-q-done" aria-labelledby="forms-done-h">
      <SdSpot name="seal-check" size={96} className="sd-q-spot" />
      <h2 id="forms-done-h" className="sd-q-qtitle" tabIndex={-1} ref={(el) => el?.focus({ preventScroll: true })}>{st === "submitted" ? `${card.title}: ${CARD_STATUS_LABEL[st]}` : card.title}</h2>
      <p className="sd-q-p">{st === "submitted" ? "תודה. מה שמילאתם כבר אצלנו, והצוות ימשיך מכאן." : "אפשר להמשיך מאותו מקום בכל פעם שחוזרים."}</p>
      <div className="sd-q-next">
        <h3>מה הלאה</h3>
        <p>{next ? `השאלון הבא בתור: ${next.title} (כ־${next.minutes} דקות).` : "סיימתם את כל השאלונים. נחזור אליכם."}</p>
      </div>
      <div className="sd-forms-done-actions">
        {next && <Link to={cardPath(next)} className="sd-q-btn">ממשיכים לשאלון הבא<BrandIcon name="arrow-left" size={18} /></Link>}
        <Link to="/forms" className="sd-q-btn is-quiet">לכל השאלונים</Link>
      </div>
    </section>
  );
}
