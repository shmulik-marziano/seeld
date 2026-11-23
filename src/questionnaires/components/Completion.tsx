// Completion: signature step (drawn or typed) and the thank-you screen with PDF / print / JSON.
// The PDF writer is a dynamic import so it loads only here.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Answers, Questionnaire } from "../types";
import { buildView, downloadText, toJsonExport } from "../format";
import type { ViewSection } from "../format";
import { buildSubmitPayload } from "../adapters";
import { hashPayload } from "../hash";
import { HEALTH_PRIVACY_NOTE } from "../copy";
import { digitsOnly, validateIsraeliId, validatePersonName } from "../validators";
import { maskId } from "../format";
import { SignaturePad } from "./SignaturePad";
import { SdSpot } from "@/components/sd/SdSpot";

export interface SignedResult {
  signerName: string;
  signerId: string;
  signature: { kind: "drawn" | "typed"; png?: string; name: string };
  signedAt: string;
  hash: string;
}

export function SignStep({ def, answers, sensitive, onBack, onSigned }: { def: Questionnaire; answers: Answers; sensitive: boolean; onBack: () => void; onSigned: (r: SignedResult) => void }) {
  // never pull health answers into identity fields; name/ID prefill only for non-health questionnaires
  const pre = (k: string) => (!sensitive && typeof answers[k] === "string" ? (answers[k] as string) : "");
  const [name, setName] = useState([pre("first_name"), pre("last_name")].filter(Boolean).join(" "));
  const [id, setId] = useState(pre("identity_document"));
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [png, setPng] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [agree, setAgree] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const now = useMemo(() => new Date(), []);

  const nameR = validatePersonName(name, { min: 2, max: 80 });
  const idR = validateIsraeliId(id);
  const sigOk = mode === "draw" ? !!png : typed.trim().length > 1 && typed.trim() === name.trim();
  const errs = { name: !nameR.ok && nameR.message, id: !idR.ok && idR.message, sig: !sigOk && (mode === "draw" ? "כדאי לחתום בתיבה, או לעבור להקלדת שם" : "כדי לחתום בהקלדה, כותבים את השם המלא בדיוק כמו בשדה למעלה"), agree: !agree && "כדי להמשיך צריך לסמן את ההצהרה" };
  const ok = nameR.ok && idR.ok && sigOk && agree;

  const finish = async () => {
    setTried(true);
    if (!ok) return;
    setBusy(true);
    const signedAt = new Date().toISOString();
    const payload = buildSubmitPayload({ def, answers, mode: "agent", sessionId: "local", stepKey: null, submit: true, now: new Date(signedAt) });
    const hash = await hashPayload({ q: payload.questionnaire, fields: Object.fromEntries(Object.entries(payload.fields).map(([k, v]) => [k, v.value])), signedAt, signer: { name: nameR.value, id: idR.value } });
    onSigned({ signerName: nameR.value!, signerId: idR.value!, signature: { kind: mode === "draw" ? "drawn" : "typed", png: mode === "draw" ? png! : undefined, name: nameR.value! }, signedAt, hash });
  };

  return (
    <>
      <section className="sd-q-card sd-q-sign" aria-labelledby="q-sign-h">
        <SdSpot name="pen" size={110} className="sd-q-spot" />
        <h2 id="q-sign-h" className="sd-q-qtitle" tabIndex={-1} ref={(el) => el?.focus()}>הצהרה וחתימה</h2>
        <p className="sd-q-p">עוד צעד קטן: מאשרים שהפרטים נכונים וחותמים.</p>

        <div className="sd-q-subfield">
          <label htmlFor="q-sign-name" className="sd-q-sublabel">שם מלא</label>
          <input id="q-sign-name" className="sd-q-input" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={tried && !!errs.name || undefined} />
          {tried && errs.name && <p className="sd-q-error" role="alert">{errs.name}</p>}
        </div>
        <div className="sd-q-subfield">
          <label htmlFor="q-sign-id" className="sd-q-sublabel">מספר תעודת זהות</label>
          <input id="q-sign-id" className="sd-q-input" inputMode="numeric" dir="ltr" style={{ textAlign: "right" }} placeholder="9 ספרות" value={id} onChange={(e) => setId(e.target.value)} onBlur={() => setTried((t) => t || digitsOnly(id).length >= 9)} aria-invalid={tried && !!errs.id || undefined} />
          {tried && errs.id && <p className="sd-q-error" role="alert">{errs.id}</p>}
          <details className="sd-q-why"><summary>למה אנחנו שואלים</summary><p>כדי שהחתימה תהיה מקושרת לאדם הנכון.</p></details>
        </div>

        <div className="sd-q-tabs" role="tablist" aria-label="אופן החתימה">
          <button type="button" role="tab" aria-selected={mode === "draw"} className={mode === "draw" ? "is-on" : ""} onClick={() => setMode("draw")}>חתימה ביד</button>
          <button type="button" role="tab" aria-selected={mode === "type"} className={mode === "type" ? "is-on" : ""} onClick={() => setMode("type")}>הקלדת שם מלא</button>
        </div>
        {mode === "draw" ? <SignaturePad label="תיבת חתימה" onChange={setPng} /> : (
          <div className="sd-q-subfield">
            <label htmlFor="q-sign-typed" className="sd-q-sublabel">הקלידו את שמכם המלא כחתימה</label>
            <input id="q-sign-typed" className="sd-q-input sd-q-typedsig" value={typed} onChange={(e) => setTyped(e.target.value)} />
          </div>
        )}
        {tried && errs.sig && <p className="sd-q-error" role="alert">{errs.sig}</p>}

        <div className="sd-q-declaration">
          <h3 className="sd-q-h3">{def.declaration.title}</h3>
          {def.declaration.paragraphs.map((t) => <p key={t} className="sd-q-p">{t}</p>)}
        </div>
        <label className={`sd-q-choice is-check ${agree ? "is-on" : ""}`} style={{ marginTop: 12 }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>{def.declaration.checkbox}</span>
        </label>
        {tried && errs.agree && <p className="sd-q-error" role="alert">{errs.agree}</p>}
        <p className="sd-q-fine">תאריך ושעה: <time dateTime={now.toISOString()}>{now.toLocaleString("he-IL", { dateStyle: "long", timeStyle: "short" })}</time></p>
        {sensitive && <p className="sd-q-fine">{HEALTH_PRIVACY_NOTE}</p>}
      </section>
      <div className="sd-q-bar" role="toolbar" aria-label="חתימה">
        <button type="button" className="sd-q-btn is-quiet" onClick={onBack}>חזרה לסקירה</button>
        <button type="button" className="sd-q-btn" onClick={finish} disabled={busy}>{busy ? "רגע…" : "חתימה וסיום"}</button>
      </div>
    </>
  );
}

export function DoneStep({ def, answers, signed, sensitive, onClear, exitTo, exitLabel, submitEnabled, next, saveState }: {
  def: Questionnaire; answers: Answers; signed: SignedResult; sensitive: boolean; onClear: () => void; exitTo: string; exitLabel: string; submitEnabled: boolean;
  /** the client flow's "next questionnaire" action */
  next?: { label: string; to: string; note?: string };
  /** the final submit's state ("saving" | "saved" | "error" | ...), for the sentence under the title */
  saveState?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmHealth, setConfirmHealth] = useState(false);
  const view = useMemo<ViewSection[]>(() => buildView(def, answers), [def, answers]);
  const filename = `${def.key}-${signed.signedAt.slice(0, 10)}`;

  const makePdf = async () => {
    setBusy(true); setMsg("");
    try {
      const { buildSignedPdf } = await import("../pdf");
      const blob = await buildSignedPdf({ def, sections: view, signature: signed.signature, signerName: signed.signerName, signerIdMasked: maskId(signed.signerId), signedAt: new Date(signed.signedAt), hash: signed.hash, declaration: def.declaration.paragraphs, sensitive, payload: { signed: { name: signed.signerName, signedAt: signed.signedAt, hash: signed.hash }, ...JSON.parse(toJsonExport(def, buildView(def, answers))) } });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${filename}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMsg("הקובץ ירד למכשיר.");
    } catch { setMsg("לא הצלחנו ליצור את הקובץ. אפשר לנסות שוב, או להדפיס."); }
    setBusy(false);
  };
  const saveJson = () => downloadText(`${filename}.json`, "application/json", JSON.stringify({ signed: { name: signed.signerName, signedAt: signed.signedAt, hash: signed.hash }, ...JSON.parse(toJsonExport(def, view)) }, null, 2));

  return (
    <>
      <section className="sd-q-card sd-q-done" aria-labelledby="q-done-h">
        <SdSpot name="seal-check" size={96} className="sd-q-spot" />
        <h2 id="q-done-h" className="sd-q-qtitle" tabIndex={-1} ref={(el) => el?.focus()}>תודה, סיימת את השאלון</h2>
        <p className="sd-q-p">חתמת ב־<time dateTime={signed.signedAt}>{new Date(signed.signedAt).toLocaleString("he-IL", { dateStyle: "long", timeStyle: "short" })}</time>.</p>
        <div className="sd-q-next">
          <h3>מה קורה עכשיו</h3>
          <p>
            {!submitEnabled
              ? "בשלב זה לא נשלח כלום. העותק נשאר אצלך בלבד, והתשובות נמחקות מהדפדפן כשסוגרים או לוחצים על 'ניקוי'."
              : saveState === "error"
              ? "השליחה לצוות לא הצליחה. אפשר להוריד את העותק החתום ולנסות שוב מאוחר יותר, או להעביר אותו אלינו."
              : saveState === "saving"
              ? "שולחים לצוות…"
              : "התשובות נשלחו לצוות."}
          </p>
          <p>{next ? (next.note ?? "כדאי להוריד עותק חתום לעצמך. את המסמך הזה אנחנו כבר קיבלנו.") : "כדאי להוריד עותק חתום ולשמור אותו, ולהעביר לצוות כשנבקש."}</p>
          {next && <Link to={next.to} className="sd-q-btn sd-q-bigbtn" style={{ marginTop: 8 }}>{next.label}</Link>}
        </div>
        <div className="sd-q-done-actions">
          {sensitive && !confirmHealth ? (
            <button type="button" className="sd-q-btn" onClick={() => setConfirmHealth(true)}>הורדת השאלון החתום (PDF)</button>
          ) : (
            <button type="button" className="sd-q-btn" onClick={makePdf} disabled={busy}>{busy ? "מכינים את הקובץ…" : "הורדת השאלון החתום (PDF)"}</button>
          )}
          <button type="button" className="sd-q-btn is-quiet" onClick={() => window.print()}>הדפסה</button>
          <button type="button" className="sd-q-btn is-quiet" onClick={saveJson}>שמירה לעצמי (JSON)</button>
        </div>
        {sensitive && confirmHealth && (
          <p className="sd-q-note" role="alert">הקובץ יכלול מידע בריאותי. לוחצים שוב על 'הורדת השאלון החתום' רק אם זה בסדר מבחינתך, ומומלץ לשמור אותו במקום מאובטח.</p>
        )}
        {msg && <p className="sd-q-fine" role="status">{msg}</p>}
        <p className="sd-q-fine">טביעת אצבע של התשובות (SHA-256): <code dir="ltr" className="sd-q-hash">{signed.hash}</code></p>
        <div className="sd-q-done-actions">
          <button type="button" className="sd-q-linkbtn" onClick={onClear}>ניקוי התשובות מהדפדפן</button>
          <Link to={exitTo} className="sd-q-linkbtn">{exitLabel}</Link>
        </div>
      </section>
      <div className="sd-q-print" aria-hidden="true">
        <h1>{def.title}</h1>
        {view.map((s) => <section key={s.id}><h2>{s.title}</h2><dl>{s.rows.map((r) => <div key={r.key}><dt>{r.label}</dt><dd>{r.text}</dd></div>)}</dl></section>)}
        <p>נחתם: {signed.signerName} · {new Date(signed.signedAt).toLocaleString("he-IL")} · SHA-256 {signed.hash}</p>
      </div>
    </>
  );
}
